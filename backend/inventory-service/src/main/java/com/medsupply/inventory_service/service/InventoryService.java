
package com.medsupply.inventory_service.service;

import com.medsupply.inventory_service.dto.request.*;
import com.medsupply.inventory_service.dto.response.InventoryResponse;
import com.medsupply.inventory_service.entity.Inventory;
import com.medsupply.inventory_service.exception.*;
import com.medsupply.inventory_service.repository.InventoryRepository;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class InventoryService {

    private final InventoryRepository inventoryRepository;

    public InventoryService(InventoryRepository inventoryRepository) {
        this.inventoryRepository = inventoryRepository;
    }

    // 1. Initialize inventory
    @Transactional
    public InventoryResponse createInventory(InventoryRequest request) {

        if (inventoryRepository.existsByProductId(request.getProductId())) {
            throw new DuplicateInventoryException(
                    "Inventory already exists for this product"
            );
        }

        Inventory inventory = new Inventory(
                request.getProductId(),
                request.getQuantity()
        );

        try {
            Inventory saved = inventoryRepository.saveAndFlush(inventory);
            return InventoryResponse.fromEntity(saved);
        } catch (DataIntegrityViolationException ex) {
            throw new DuplicateInventoryException(
                    "Inventory already exists for this product"
            );
        }
    }

    // 2. Retrieve all inventory
    @Transactional(readOnly = true)
    public List<InventoryResponse> getAllInventory() {

        return inventoryRepository.findAll()
                .stream()
                .map(InventoryResponse::fromEntity)
                .toList();
    }

    // 3. Retrieve inventory by product ID
    @Transactional(readOnly = true)
    public InventoryResponse getInventoryByProductId(UUID productId) {

        Inventory inventory = inventoryRepository.findByProductId(productId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Inventory not found for product: " + productId
                ));

        return InventoryResponse.fromEntity(inventory);
    }

    // 4. Update inventory quantity
    @Transactional
    public InventoryResponse updateInventory(
            UUID productId,
            InventoryUpdateRequest request) {

        Inventory inventory = inventoryRepository
                .findByProductIdForUpdate(productId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Inventory not found for product: " + productId
                ));

        inventory.setAvailableQuantity(request.getQuantity());

        Inventory updated = inventoryRepository.save(inventory);

        return InventoryResponse.fromEntity(updated);
    }

    // 5. Deduct inventory
    @Transactional
    public InventoryResponse deductInventory(
            UUID productId,
            StockDeductionRequest request) {

        Inventory inventory = inventoryRepository
                .findByProductIdForUpdate(productId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Inventory not found for product: " + productId
                ));

        int available = inventory.getAvailableQuantity();
        int requested = request.getQuantity();

        if (available < requested) {
            throw new InsufficientStockException(
                    "Insufficient stock. Available: " + available
                            + ", Requested: " + requested
            );
        }

        inventory.setAvailableQuantity(available - requested);

        Inventory updated = inventoryRepository.save(inventory);

        return InventoryResponse.fromEntity(updated);
    }

    @Transactional
    public InventoryResponse restoreStock(UUID productId, Integer quantity) {
        if (quantity == null || quantity <= 0) {
            throw new IllegalArgumentException(
                    "Restore quantity must be greater than zero");
        }

        Inventory inventory = inventoryRepository.findByProductIdForUpdate(productId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Inventory not found for product: " + productId));

        inventory.setAvailableQuantity(
                inventory.getAvailableQuantity() + quantity);

        Inventory savedInventory = inventoryRepository.save(inventory);

        return InventoryResponse.fromEntity(savedInventory);
    }
}
