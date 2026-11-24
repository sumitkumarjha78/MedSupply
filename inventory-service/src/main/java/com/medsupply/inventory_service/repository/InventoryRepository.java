package com.medsupply.inventory_service.repository;

import com.medsupply.inventory_service.entity.Inventory;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;

import java.util.Optional;
import java.util.UUID;

public interface InventoryRepository
        extends JpaRepository<Inventory, UUID> {

    Optional<Inventory> findByProductId(UUID productId);

    boolean existsByProductId(UUID productId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT i FROM Inventory i
        WHERE i.productId = :productId
    """)
    Optional<Inventory> findByProductIdForUpdate(
            @Param("productId") UUID productId
    );
}
