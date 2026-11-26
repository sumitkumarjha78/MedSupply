package com.medsupply.order_service.dto.request;

import java.math.BigDecimal;
import java.time.Instant;

public record CoinDropWebhookEvent(
        String eventId,
        String eventType,
        String externalOrderId,
        String checkoutSessionId,
        Long paymentId,
        BigDecimal amount,
        String currency,
        String status,
        String paymentReference,
        Instant paidAt
) {}