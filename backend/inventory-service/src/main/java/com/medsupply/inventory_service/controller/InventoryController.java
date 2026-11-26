
package com.medsupply.inventory_service.controller;

import com.medsupply.inventory_service.dto.request.*;
import com.medsupply.inventory_service.dto.response.InventoryResponse;
import com.medsupply.inventory_service.service.InventoryService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    // 1. Initialize inventory
    @PostMapping
    public ResponseEntity<InventoryResponse> createInventory(
            @Valid @RequestBody InventoryRequest request) {

        InventoryResponse response =
                inventoryService.createInventory(request);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // 2. Get all inventory
    @GetMapping
    public ResponseEntity<List<InventoryResponse>> getAllInventory() {

        return ResponseEntity.ok(
                inventoryService.getAllInventory()
        );
    }

    // 3. Get inventory by product ID
    @GetMapping("/{productId}")
    public ResponseEntity<InventoryResponse> getInventoryByProductId(
            @PathVariable UUID productId) {

        return ResponseEntity.ok(
                inventoryService.getInventoryByProductId(productId)
        );
    }

    // 4. Update inventory
    @PutMapping("/{productId}")
    public ResponseEntity<InventoryResponse> updateInventory(
            @PathVariable UUID productId,
            @Valid @RequestBody InventoryUpdateRequest request) {

        return ResponseEntity.ok(
                inventoryService.updateInventory(productId, request)
        );
    }

    // 5. Deduct inventory
    @PostMapping("/{productId}/deduct")
    public ResponseEntity<InventoryResponse> deductInventory(
            @PathVariable UUID productId,
            @Valid @RequestBody StockDeductionRequest request) {

        return ResponseEntity.ok(
                inventoryService.deductInventory(productId, request)
        );
    }

    @PostMapping("/{productId}/restore")
    public ResponseEntity<InventoryResponse> restoreStock(
            @PathVariable UUID productId,
            @Valid @RequestBody StockDeductionRequest request) {

        InventoryResponse response = inventoryService.restoreStock(
                productId,
                request.getQuantity()
        );

        return ResponseEntity.ok(response);
    }
}
