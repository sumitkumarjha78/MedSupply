package com.medsupply.product_service.repository;

import com.medsupply.product_service.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ProductRepository extends JpaRepository<Product, UUID> {
    boolean existsBySku(String sku);
}