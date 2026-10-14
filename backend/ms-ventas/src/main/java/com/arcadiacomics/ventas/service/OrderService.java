package com.arcadiacomics.ventas.service;

import com.arcadiacomics.ventas.dto.*;
import com.arcadiacomics.ventas.model.entity.Order;
import com.arcadiacomics.ventas.model.entity.OrderItem;
import com.arcadiacomics.ventas.model.enums.OrderStatus;
import com.arcadiacomics.ventas.repository.OrderRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Servicio de negocio de Ventas / Checkout.
 * Gestiona la persistencia de la orden y publica de forma desacoplada
 * el evento VentaEventoDTO hacia RabbitMQ sin bloquear la respuesta HTTP al cliente.
 */
@Service
public class OrderService {

    private static final Logger log = LoggerFactory.getLogger(OrderService.class);

    @Value("${MS_COMICS_URL:${ms.comics.url:http://ms-comics:8081}}")
    private String msComicsUrl;

    private final OrderRepository orderRepository;
    private final OrderEventPublisher eventPublisher;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public OrderService(OrderRepository orderRepository, OrderEventPublisher eventPublisher) {
        this.orderRepository = orderRepository;
        this.eventPublisher = eventPublisher;
    }

    @Transactional
    public OrderResponse processCheckout(CheckoutRequest request) {
        log.info("Procesando checkout para usuario={}: nombre={}, email={}, total=${}",
                request.getUserId(), request.getCustomerName(), request.getCustomerEmail(), request.getTotalAmount());

        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El carrito no contiene productos");
        }

        // Validación de stock: rechazo directo sin enviar a la cola
        validarDisponibilidadStock(request.getItems());

        Order order = new Order();
        order.setUserId(request.getUserId());
        order.setCustomerName(request.getCustomerName());
        order.setCustomerEmail(request.getCustomerEmail());
        order.setTotalAmount(request.getTotalAmount());
        order.setStatus(OrderStatus.PAID);

        List<OrderItem> items = request.getItems().stream()
                .map(dto -> new OrderItem(
                        dto.getComicId(),
                        dto.getQuantity(),
                        dto.getTitle(),
                        dto.getPrice(),
                        dto.getCoverImage()
                ))
                .collect(Collectors.toList());
        order.setItems(items);

        Order savedOrder = orderRepository.save(order);
        log.info("Orden guardada exitosamente en BD con ID: {}", savedOrder.getId());

        // Mapeo al DTO oficial del evento de venta
        List<VentaItemDTO> itemsEvento = savedOrder.getItems().stream()
                .map(i -> new VentaItemDTO(
                        i.getComicId(),
                        i.getTitle(),
                        i.getPrice(),
                        i.getQuantity(),
                        i.getCoverImage()
                ))
                .collect(Collectors.toList());

        VentaEventoDTO ventaEvento = new VentaEventoDTO(
                savedOrder.getId(),
                savedOrder.getUserId(),
                savedOrder.getCustomerName(),
                savedOrder.getCustomerEmail(),
                itemsEvento,
                savedOrder.getTotalAmount()
        );

        // Publicación desacoplada al Direct Exchange 'comics.ventas.direct' con routing key 'venta.confirmada'
        eventPublisher.publicarVentaConfirmada(ventaEvento);

        // Retorno inmediato al cliente (desacoplado de la generación de PDF y actualización de stock)
        return new OrderResponse(savedOrder);
    }

    public OrderResponse getOrderById(String id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + id));
        return new OrderResponse(order);
    }

    @Transactional
    public OrderResponse updateOrderStatus(String id, OrderStatus status) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + id));

        order.setStatus(status);
        Order updatedOrder = orderRepository.save(order);

        if (status == OrderStatus.PAID) {
            List<VentaItemDTO> itemsEvento = updatedOrder.getItems().stream()
                    .map(i -> new VentaItemDTO(
                            i.getComicId(),
                            i.getTitle(),
                            i.getPrice(),
                            i.getQuantity(),
                            i.getCoverImage()
                    ))
                    .collect(Collectors.toList());

            VentaEventoDTO ventaEvento = new VentaEventoDTO(
                    updatedOrder.getId(),
                    updatedOrder.getUserId(),
                    updatedOrder.getCustomerName(),
                    updatedOrder.getCustomerEmail(),
                    itemsEvento,
                    updatedOrder.getTotalAmount()
            );
            eventPublisher.publicarVentaConfirmada(ventaEvento);
        }

        return new OrderResponse(updatedOrder);
    }

    public List<OrderResponse> getOrderHistory(String userId) {
        return orderRepository.findByUserId(userId).stream()
                .map(OrderResponse::new)
                .collect(Collectors.toList());
    }

    public List<OrderResponse> getAllOrders() {
        return orderRepository.findAll().stream()
                .map(OrderResponse::new)
                .collect(Collectors.toList());
    }

    /**
     * Valida la disponibilidad de stock directamente contra ms-comics antes de procesar
     * la orden y antes de emitir ningún mensaje a RabbitMQ.
     */
    private void validarDisponibilidadStock(List<OrderItemDTO> items) {
        for (OrderItemDTO item : items) {
            if (item.getQuantity() <= 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "La cantidad de '" + item.getTitle() + "' debe ser mayor a cero");
            }

            try {
                URI uri = URI.create(msComicsUrl + "/api/comics/" + item.getComicId());
                HttpURLConnection conn = (HttpURLConnection) uri.toURL().openConnection();
                conn.setRequestMethod("GET");
                conn.setConnectTimeout(2500);
                conn.setReadTimeout(2500);

                if (conn.getResponseCode() == 200) {
                    try (InputStream is = conn.getInputStream()) {
                        JsonNode root = objectMapper.readTree(is);
                        if (root.has("stock")) {
                            int stockDisponible = root.get("stock").asInt();
                            if (stockDisponible <= 0) {
                                log.warn("❌ [STOCK INSUFICIENTE] Cómic '{}' (ID: {}) se encuentra AGOTADO (stock: 0)",
                                        item.getTitle(), item.getComicId());
                                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                        "El cómic '" + item.getTitle() + "' se encuentra agotado (Stock: 0)");
                            }
                            if (item.getQuantity() > stockDisponible) {
                                log.warn("❌ [STOCK INSUFICIENTE] Cómic '{}' (ID: {}) solicita {} unid. pero solo quedan {}",
                                        item.getTitle(), item.getComicId(), item.getQuantity(), stockDisponible);
                                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                        "Stock insuficiente para '" + item.getTitle() + "'. Solicitadas: "
                                                + item.getQuantity() + ", Disponibles: " + stockDisponible);
                            }
                        }
                    }
                }
            } catch (ResponseStatusException rse) {
                throw rse;
            } catch (Exception e) {
                log.info("Verificación remota omitida para '{}' ({}).", item.getComicId(), e.getMessage());
            }
        }
    }
}
