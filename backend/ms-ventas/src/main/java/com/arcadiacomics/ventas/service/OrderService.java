package com.arcadiacomics.ventas.service;

import com.arcadiacomics.ventas.dto.CheckoutRequest;
import com.arcadiacomics.ventas.dto.OrderEventDTO;
import com.arcadiacomics.ventas.dto.OrderResponse;
import com.arcadiacomics.ventas.model.entity.Order;
import com.arcadiacomics.ventas.model.entity.OrderItem;
import com.arcadiacomics.ventas.model.enums.OrderStatus;
import com.arcadiacomics.ventas.repository.OrderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderEventPublisher eventPublisher;

    public OrderService(OrderRepository orderRepository, OrderEventPublisher eventPublisher) {
        this.orderRepository = orderRepository;
        this.eventPublisher = eventPublisher;
    }

    @Transactional
    public OrderResponse processCheckout(CheckoutRequest request) {
        Order order = new Order();
        order.setUserId(request.getUserId());
        order.setTotalAmount(request.getTotalAmount());
        order.setStatus(OrderStatus.PENDING); // Inicialmente PENDING

        List<OrderItem> items = request.getItems().stream()
                .map(dto -> new OrderItem(dto.getComicId(), dto.getQuantity()))
                .collect(Collectors.toList());
        order.setItems(items);

        Order savedOrder = orderRepository.save(order);

        // Ya no lanzamos el evento acá porque está PENDING.
        // El evento se debería lanzar cuando se confirme el pago y pase a PAID.

        return new OrderResponse(savedOrder);
    }

    public OrderResponse getOrderById(String id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        return new OrderResponse(order);
    }

    @Transactional
    public OrderResponse updateOrderStatus(String id, OrderStatus status) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        
        order.setStatus(status);
        Order updatedOrder = orderRepository.save(order);
        
        if (status == OrderStatus.PAID) {
            OrderEventDTO eventDTO = new OrderEventDTO(
                    updatedOrder.getId(),
                    updatedOrder.getUserId(),
                    updatedOrder.getItems().stream().map(i -> {
                        com.arcadiacomics.ventas.dto.OrderItemDTO dto = new com.arcadiacomics.ventas.dto.OrderItemDTO();
                        dto.setComicId(i.getComicId());
                        dto.setQuantity(i.getQuantity());
                        return dto;
                    }).collect(Collectors.toList())
            );
            eventPublisher.publishOrderPaidEvent(eventDTO);
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
