
package com.medsupply.order_service.dto.request;

import com.medsupply.order_service.entity.OrderStatus;

import jakarta.validation.constraints.NotNull;

public class OrderStatusRequest {

    @NotNull(message = "Order status is required")
    private OrderStatus status;

    public OrderStatus getStatus() {
        return status;
    }

    public void setStatus(OrderStatus status) {
        this.status = status;
    }
}
