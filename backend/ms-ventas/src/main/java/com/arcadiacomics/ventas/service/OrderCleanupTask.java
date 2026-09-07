package com.arcadiacomics.ventas.service;

import com.arcadiacomics.ventas.model.entity.Order;
import com.arcadiacomics.ventas.model.enums.OrderStatus;
import com.arcadiacomics.ventas.repository.OrderRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class OrderCleanupTask {

    private final OrderRepository orderRepository;

    public OrderCleanupTask(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    // Se ejecuta cada 5 minutos (300000 ms)
    @Scheduled(fixedRate = 300000)
    @Transactional
    public void cancelExpiredPendingOrders() {
        LocalDateTime thirtyMinutesAgo = LocalDateTime.now().minusMinutes(30);
        
        List<Order> expiredOrders = orderRepository.findByStatusAndCreatedAtBefore(OrderStatus.PENDING, thirtyMinutesAgo);
        
        for (Order order : expiredOrders) {
            order.setStatus(OrderStatus.CANCELLED);
        }
        
        if (!expiredOrders.isEmpty()) {
            orderRepository.saveAll(expiredOrders);
            System.out.println("Cancelled " + expiredOrders.size() + " expired pending orders.");
        }
    }
}
