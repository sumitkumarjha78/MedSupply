package com.medsupply.product_service.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record ProductRequest(
        @NotBlank(message = "Product name is required")
        String productName,

        @NotBlank(message = "SKU is required")
        String sku,

        String description,

        @NotBlank(message = "Category is required")
        String category,

        @NotNull(message = "Unit price is required")
        @DecimalMin(value = "0.01", message = "Unit price must be positive")
        BigDecimal unitPrice,

        @NotBlank(message = "Unit of measurement is required")
        String unitOfMeasurement,

        Boolean active
) {}