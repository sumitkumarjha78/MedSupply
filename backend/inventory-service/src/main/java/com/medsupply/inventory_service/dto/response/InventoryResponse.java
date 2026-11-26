
package com.medsupply.inventory_service.dto.response;

import com.medsupply.inventory_service.entity.Inventory;

import java.time.Instant;
import java.util.UUID;

public class InventoryResponse {

    private UUID id;
    private UUID productId;
    private Integer availableQuantity;
    private Instant updatedAt;

    public InventoryResponse(
            UUID id,
            UUID productId,
            Integer availableQuantity,
            Instant updatedAt) {

        this.id = id;
        this.productId = productId;
        this.availableQuantity = availableQuantity;
        this.updatedAt = updatedAt;
    }

    public static InventoryResponse fromEntity(Inventory inventory) {
        return new InventoryResponse(
                inventory.getId(),
                inventory.getProductId(),
                inventory.getAvailableQuantity(),
                inventory.getUpdatedAt()
        );
    }

    public UUID getId() {
        return id;
    }

    public UUID getProductId() {
        return productId;
    }

    public Integer getAvailableQuantity() {
        return availableQuantity;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
