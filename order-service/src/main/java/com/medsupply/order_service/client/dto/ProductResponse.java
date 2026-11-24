package com.medsupply.order_service.client.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record ProductResponse(
        UUID id,
        String productName,
        String sku,
        String description,
        String category,
        BigDecimal unitPrice,
        String unitOfMeasurement,
        Boolean active,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
