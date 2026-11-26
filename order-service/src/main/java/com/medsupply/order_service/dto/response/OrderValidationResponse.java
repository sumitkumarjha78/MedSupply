package com.medsupply.order_service.dto.response;

import com.medsupply.order_service.entity.OrderStatus;
import com.medsupply.order_service.entity.PaymentStatus;

import java.math.BigDecimal;

public record OrderValidationResponse(
        String externalOrderId,
        String hospitalReference,
        String hospitalName,
        BigDecimal amount,
        String currency,
        OrderStatus orderStatus,
        PaymentStatus paymentStatus,
        String customerName,
        String customerEmail
) {}