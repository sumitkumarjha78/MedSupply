package com.medsupply.order_service.repository;

import com.medsupply.order_service.entity.Order;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrderRepository extends JpaRepository<Order, UUID> {

    List<Order> findByBuyerUserId(UUID buyerUserId);

    Optional<Order> findByIdAndBuyerUserId(UUID id, UUID buyerUserId);

    Optional<Order> findByOrderNumber(String orderNumber);

    Optional<Order> findByOrderNumberAndBuyerUserId(String orderNumber, UUID buyerUserId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT o FROM Order o WHERE o.orderNumber = :orderNumber")
    Optional<Order> findByOrderNumberForUpdate(@Param("orderNumber") String orderNumber);

    boolean existsByOrderNumber(String orderNumber);
}