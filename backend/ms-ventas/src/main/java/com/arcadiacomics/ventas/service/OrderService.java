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

    private final OrderRepository orderRepository;
    private final OrderEventPublisher eventPublisher;

    public OrderService(OrderRepository orderRepository, OrderEventPublisher eventPublisher) {
        this.orderRepository = orderRepository;
        this.eventPublisher = eventPublisher;
    }

    @Transactional
    public OrderResponse processCheckout(CheckoutRequest request) {
        log.info("Procesando checkout para usuario={}: nombre={}, email={}, total=${}",
                request.getUserId(), request.getCustomerName(), request.getCustomerEmail(), request.getTotalAmount());

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
}
