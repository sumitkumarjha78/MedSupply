package com.medsupply.order_service.controller;

import com.medsupply.order_service.dto.request.OrderRequest;
import com.medsupply.order_service.dto.request.OrderStatusRequest;
import com.medsupply.order_service.dto.response.OrderResponse;
import com.medsupply.order_service.entity.Order;
import com.medsupply.order_service.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(
            @Valid @RequestBody OrderRequest request,
            @RequestHeader("X-User-Id") UUID buyerUserId,
            @RequestHeader("X-User-Role") String userRole,
            @RequestHeader(value = "X-User-Email", required = false) String userEmail) {

        Order order = orderService.createOrder(request, buyerUserId, userRole, userEmail);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(OrderResponse.fromEntity(order));
    }

    @GetMapping
    public ResponseEntity<List<OrderResponse>> getAllOrders(
            @RequestHeader("X-User-Id") UUID buyerUserId,
            @RequestHeader("X-User-Role") String userRole) {

        return ResponseEntity.ok(orderService.getAllOrders(buyerUserId, userRole));
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> getOrderById(
            @PathVariable UUID id,
            @RequestHeader("X-User-Id") UUID buyerUserId,
            @RequestHeader("X-User-Role") String userRole) {

        Order order = orderService.getOrderById(id, buyerUserId, userRole);

        return ResponseEntity.ok(OrderResponse.fromEntity(order));
    }

    @GetMapping("/by-number/{orderNumber}")
    public ResponseEntity<OrderResponse> getOrderByOrderNumber(
            @PathVariable String orderNumber,
            @RequestHeader("X-User-Id") UUID buyerUserId,
            @RequestHeader("X-User-Role") String userRole) {

        Order order = orderService.getOrderByOrderNumber(orderNumber, buyerUserId, userRole);

        return ResponseEntity.ok(OrderResponse.fromEntity(order));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<OrderResponse> updateOrderStatus(
            @PathVariable UUID id,
            @Valid @RequestBody OrderStatusRequest request,
            @RequestHeader("X-User-Id") UUID buyerUserId,
            @RequestHeader("X-User-Role") String userRole) {

        Order order = orderService.updateOrderStatus(
                id,
                request.getStatus(),
                buyerUserId,
                userRole
        );

        return ResponseEntity.ok(OrderResponse.fromEntity(order));
    }
}