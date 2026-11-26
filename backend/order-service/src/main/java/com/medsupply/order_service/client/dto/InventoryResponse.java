
package com.medsupply.order_service.client.dto;

import java.time.Instant;
import java.util.UUID;

public record InventoryResponse(
        UUID id,
        UUID productId,
        Integer availableQuantity,
        Instant updatedAt
) {
}
