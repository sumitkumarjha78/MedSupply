
package com.medsupply.order_service.repository;

import com.medsupply.order_service.entity.Order;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrderRepository extends JpaRepository<Order, UUID> {

    List<Order> findByBuyerUserId(UUID buyerUserId);

    Optional<Order> findByIdAndBuyerUserId(
            UUID id,
            UUID buyerUserId
    );

    boolean existsByOrderNumber(String orderNumber);
}
