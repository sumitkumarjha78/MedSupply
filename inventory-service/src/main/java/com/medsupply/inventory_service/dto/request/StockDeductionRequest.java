
package com.medsupply.inventory_service.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public class StockDeductionRequest {

    @NotNull(message = "Quantity is required")
    @Positive(message = "Deduction quantity must be greater than zero")
    private Integer quantity;

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }
}
