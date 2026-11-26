package com.medsupply.product_service.service;

import com.medsupply.product_service.dto.request.ProductRequest;
import com.medsupply.product_service.dto.response.ProductResponse;
import com.medsupply.product_service.entity.Product;
import com.medsupply.product_service.exception.DuplicateSkuException;
import com.medsupply.product_service.exception.ResourceNotFoundException;
import com.medsupply.product_service.repository.ProductRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class ProductService {

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public ProductResponse createProduct(ProductRequest request) {
        String normalizedSku = request.sku().trim().toUpperCase();
        if (productRepository.existsBySku(normalizedSku)) {
            throw new DuplicateSkuException("Product with SKU already exists: " + normalizedSku);
        }

        Product product = new Product(
                request.productName().trim(),
                normalizedSku,
                request.description() != null ? request.description().trim() : null,
                request.category().trim(),
                request.unitPrice(),
                request.unitOfMeasurement().trim().toUpperCase(),
                request.active() != null ? request.active() : true
        );
        return toResponse(productRepository.save(product));
    }

    public List<ProductResponse> getAllProducts() {
        return productRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public ProductResponse getProductById(UUID id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
        return toResponse(product);
    }

    public ProductResponse updateProduct(UUID id, ProductRequest request) {
        Product existing = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));

        String normalizedSku = request.sku().trim().toUpperCase();
        if (!existing.getSku().equals(normalizedSku) && productRepository.existsBySku(normalizedSku)) {
            throw new DuplicateSkuException("Product with SKU already exists: " + normalizedSku);
        }

        existing.setProductName(request.productName().trim());
        existing.setSku(normalizedSku);
        existing.setDescription(request.description() != null ? request.description().trim() : null);
        existing.setCategory(request.category().trim());
        existing.setUnitPrice(request.unitPrice());
        existing.setUnitOfMeasurement(request.unitOfMeasurement().trim().toUpperCase());
        if (request.active() != null) {
            existing.setActive(request.active());
        }

        return toResponse(productRepository.save(existing));
    }

    public void deleteProduct(UUID id) {
        if (!productRepository.existsById(id)) {
            throw new ResourceNotFoundException("Product not found with id: " + id);
        }
        productRepository.deleteById(id);
    }

    private ProductResponse toResponse(Product product) {
        return new ProductResponse(
                product.getId(),
                product.getProductName(),
                product.getSku(),
                product.getDescription(),
                product.getCategory(),
                product.getUnitPrice(),
                product.getUnitOfMeasurement(),
                product.getActive(),
                product.getCreatedAt(),
                product.getUpdatedAt()
        );
    }
}