package com.arcadiacomics.ventas.controller;

import com.arcadiacomics.ventas.dto.CheckoutRequest;
import com.arcadiacomics.ventas.dto.OrderResponse;
import com.arcadiacomics.ventas.model.enums.OrderStatus;
import com.arcadiacomics.ventas.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/orders")
@CrossOrigin(origins = "*")
public class OrderController {

    private final OrderService orderService;
    private final com.arcadiacomics.ventas.consumer.StockUpdateConsumer stockUpdateConsumer;

    public OrderController(OrderService orderService, com.arcadiacomics.ventas.consumer.StockUpdateConsumer stockUpdateConsumer) {
        this.orderService = orderService;
        this.stockUpdateConsumer = stockUpdateConsumer;
    }

    @PostMapping("/checkout")
    public ResponseEntity<OrderResponse> checkout(@Valid @RequestBody CheckoutRequest request) {
        OrderResponse response = orderService.processCheckout(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> getOrder(@PathVariable String id) {
        return ResponseEntity.ok(orderService.getOrderById(id));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<OrderResponse> updateStatus(
            @PathVariable String id,
            @RequestParam OrderStatus status) {
        OrderResponse response = orderService.updateOrderStatus(id, status);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/history/{userId}")
    public ResponseEntity<List<OrderResponse>> getOrderHistory(@PathVariable String userId) {
        List<OrderResponse> response = orderService.getOrderHistory(userId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/user-orders")
    public ResponseEntity<List<OrderResponse>> getUserOrders(
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String email) {
        List<OrderResponse> response = orderService.getOrdersByUserOrEmail(userId, email);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<OrderResponse>> getAllOrders() {
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    @GetMapping("/stock")
    public ResponseEntity<java.util.Map<String, Integer>> getAllStocks() {
        return ResponseEntity.ok(stockUpdateConsumer.getTodosLosStocks());
    }

    @GetMapping("/stock/{comicId}")
    public ResponseEntity<java.util.Map<String, Object>> getStockByComic(@PathVariable String comicId) {
        int stock = stockUpdateConsumer.getStockActual(comicId);
        return ResponseEntity.ok(java.util.Map.of(
                "comicId", comicId,
                "stockDisponible", stock,
                "mensaje", "Stock actualizado por cola RabbitMQ ('cola.ventas.stock')"
        ));
    }

    @GetMapping("/health")
    public ResponseEntity<java.util.Map<String, String>> health() {
        return ResponseEntity.ok(java.util.Map.of(
                "status", "UP",
                "service", "microservicio-ventas",
                "port", "8082"
        ));
    }

    @ExceptionHandler(org.springframework.web.server.ResponseStatusException.class)
    public ResponseEntity<java.util.Map<String, Object>> handleResponseStatus(org.springframework.web.server.ResponseStatusException ex) {
        String msg = ex.getReason() != null ? ex.getReason() : "Error en validación de compra";
        return ResponseEntity.status(ex.getStatusCode()).body(java.util.Map.of(
                "status", ex.getStatusCode().value(),
                "error", msg,
                "message", msg
        ));
    }
}
