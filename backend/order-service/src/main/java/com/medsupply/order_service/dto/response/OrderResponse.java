package com.medsupply.order_service.dto.response;

import com.medsupply.order_service.entity.Order;
import com.medsupply.order_service.entity.OrderStatus;
import com.medsupply.order_service.entity.PaymentStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class OrderResponse {

    private UUID id;
    private UUID hospitalId;
    private String orderNumber;
    private String facilityName;
    private UUID buyerUserId;
    private List<OrderItemResponse> items;
    private BigDecimal totalAmount;
    private String currency;
    private OrderStatus status;
    private PaymentStatus paymentStatus;
    private String paymentReference;
    private Instant paidAt;
    private Instant createdAt;
    private Instant updatedAt;

    public OrderResponse(
            UUID id,
            UUID hospitalId,
            String orderNumber,
            String facilityName,
            UUID buyerUserId,
            List<OrderItemResponse> items,
            BigDecimal totalAmount,
            String currency,
            OrderStatus status,
            PaymentStatus paymentStatus,
            String paymentReference,
            Instant paidAt,
            Instant createdAt,
            Instant updatedAt) {

        this.id = id;
        this.hospitalId = hospitalId;
        this.orderNumber = orderNumber;
        this.facilityName = facilityName;
        this.buyerUserId = buyerUserId;
        this.items = items;
        this.totalAmount = totalAmount;
        this.currency = currency;
        this.status = status;
        this.paymentStatus = paymentStatus;
        this.paymentReference = paymentReference;
        this.paidAt = paidAt;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public static OrderResponse fromEntity(Order order) {
        List<OrderItemResponse> itemResponses =
                order.getItems()
                        .stream()
                        .map(OrderItemResponse::fromEntity)
                        .toList();

        return new OrderResponse(
                order.getId(),
                order.getHospitalId(),
                order.getOrderNumber(),
                order.getFacilityName(),
                order.getBuyerUserId(),
                itemResponses,
                order.getTotalAmount(),
                order.getCurrency(),
                order.getStatus(),
                order.getPaymentStatus(),
                order.getPaymentReference(),
                order.getPaidAt(),
                order.getCreatedAt(),
                order.getUpdatedAt()
        );
    }

    public UUID getId() {
        return id;
    }

    public UUID getHospitalId() {
        return hospitalId;
    }

    public String getOrderNumber() {
        return orderNumber;
    }

    public String getFacilityName() {
        return facilityName;
    }

    public UUID getBuyerUserId() {
        return buyerUserId;
    }

    public List<OrderItemResponse> getItems() {
        return items;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public String getCurrency() {
        return currency;
    }

    public OrderStatus getStatus() {
        return status;
    }

    public PaymentStatus getPaymentStatus() {
        return paymentStatus;
    }

    public String getPaymentReference() {
        return paymentReference;
    }

    public Instant getPaidAt() {
        return paidAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}