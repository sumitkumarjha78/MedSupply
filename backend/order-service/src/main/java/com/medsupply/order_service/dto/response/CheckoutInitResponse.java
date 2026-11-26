package com.medsupply.order_service.dto.response;

import java.time.Instant;
import java.util.UUID;

public record CheckoutInitResponse(
        UUID orderId,
        String externalOrderId,
        String checkoutSessionId,
        String checkoutUrl,
        String status,
        Instant expiresAt
) {}