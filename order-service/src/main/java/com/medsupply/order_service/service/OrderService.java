package com.medsupply.order_service.service;

import com.medsupply.order_service.client.HospitalClient;
import com.medsupply.order_service.client.InventoryClient;
import com.medsupply.order_service.client.ProductClient;

import com.medsupply.order_service.client.dto.InventoryResponse;
import com.medsupply.order_service.client.dto.ProductResponse;
import com.medsupply.order_service.dto.request.OrderItemRequest;
import com.medsupply.order_service.dto.request.OrderRequest;
import com.medsupply.order_service.dto.response.HospitalResponse;
import com.medsupply.order_service.dto.response.OrderResponse;
import com.medsupply.order_service.entity.Order;
import com.medsupply.order_service.entity.OrderItem;
import com.medsupply.order_service.entity.OrderStatus;
import com.medsupply.order_service.exception.InsufficientStockException;
import com.medsupply.order_service.exception.ResourceNotFoundException;
import com.medsupply.order_service.repository.OrderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductClient productClient;
    private final InventoryClient inventoryClient;
    private final HospitalClient hospitalClient;

    public OrderService(
            OrderRepository orderRepository,
            ProductClient productClient,
            InventoryClient inventoryClient,
            HospitalClient hospitalClient) {

        this.orderRepository = orderRepository;
        this.productClient = productClient;
        this.inventoryClient = inventoryClient;
        this.hospitalClient = hospitalClient;
    }

    @Transactional
    public Order createOrder(OrderRequest request, UUID buyerUserId, String userRole) {

        UUID verifiedHospitalId = null;
        String resolvedFacilityName;

        if ("HOSPITAL_BUYER".equals(userRole)) {
            HospitalResponse hospital = hospitalClient.getHospitalByUserId(buyerUserId);
            verifiedHospitalId = hospital.id();
            resolvedFacilityName = hospital.hospitalName();
        } else {
            if (request.getFacilityName() == null || request.getFacilityName().trim().isEmpty()) {
                throw new IllegalArgumentException("Facility name is required");
            }
            resolvedFacilityName = request.getFacilityName().trim();
        }

        Set<UUID> productIds = new HashSet<>();

        for (OrderItemRequest itemRequest : request.getItems()) {
            if (!productIds.add(itemRequest.getProductId())) {
                throw new IllegalArgumentException(
                        "Duplicate product in order: " + itemRequest.getProductId()
                );
            }
        }

        List<OrderItem> orderItems = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;

        for (OrderItemRequest itemRequest : request.getItems()) {

            UUID productId = itemRequest.getProductId();
            Integer quantity = itemRequest.getQuantity();

            ProductResponse product = productClient.getProductById(productId);

            if (product == null || product.id() == null) {
                throw new IllegalArgumentException(
                        "Product not found: " + productId
                );
            }

            if (!Boolean.TRUE.equals(product.active())) {
                throw new IllegalArgumentException(
                        "Product is inactive: " + productId
                );
            }

            if (product.unitPrice() == null
                    || product.unitPrice().compareTo(BigDecimal.ZERO) < 0) {
                throw new IllegalStateException(
                        "Invalid product price for: " + productId
                );
            }

            InventoryResponse inventory =
                    inventoryClient.getInventoryByProductId(productId);

            if (inventory == null
                    || inventory.availableQuantity() == null
                    || inventory.availableQuantity() < quantity) {
                throw new InsufficientStockException(
                        "Insufficient stock for product: " + productId
                );
            }

            BigDecimal subtotal = product.unitPrice()
                    .multiply(BigDecimal.valueOf(quantity));

            OrderItem orderItem = new OrderItem();
            orderItem.setProductId(productId);
            orderItem.setProductName(product.productName());
            orderItem.setQuantity(quantity);
            orderItem.setUnitPrice(product.unitPrice());
            orderItem.setSubtotal(subtotal);

            orderItems.add(orderItem);
            totalAmount = totalAmount.add(subtotal);
        }

        Order order = new Order();
        order.setOrderNumber(generateOrderNumber());
        order.setFacilityName(resolvedFacilityName);
        order.setHospitalId(verifiedHospitalId);
        order.setBuyerUserId(buyerUserId);
        order.setTotalAmount(totalAmount);
        order.setStatus(OrderStatus.CONFIRMED);

        for (OrderItem item : orderItems) {
            order.addItem(item);
        }

        List<OrderItem> deductedItems = new ArrayList<>();

        try {
            for (OrderItem item : orderItems) {
                inventoryClient.deductStock(
                        item.getProductId(),
                        item.getQuantity()
                );
                deductedItems.add(item);
            }

            return orderRepository.save(order);

        } catch (RuntimeException ex) {

            for (int i = deductedItems.size() - 1; i >= 0; i--) {
                OrderItem item = deductedItems.get(i);

                try {
                    inventoryClient.restoreStock(
                            item.getProductId(),
                            item.getQuantity()
                    );
                } catch (RuntimeException restoreException) {
                    ex.addSuppressed(restoreException);
                }
            }

            throw ex;
        }
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getAllOrders(UUID buyerUserId, String userRole) {
        List<Order> orders = "ADMIN".equals(userRole)
                ? orderRepository.findAll()
                : orderRepository.findByBuyerUserId(buyerUserId);

        return orders.stream()
                .map(OrderResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public Order getOrderById(UUID orderId, UUID buyerUserId, String userRole) {
        return findAccessibleOrder(orderId, buyerUserId, userRole);
    }

    @Transactional
    public Order updateOrderStatus(
            UUID orderId,
            OrderStatus newStatus,
            UUID buyerUserId,
            String userRole) {

        Order order = findAccessibleOrder(orderId, buyerUserId, userRole);

        if (newStatus == null) {
            throw new IllegalArgumentException("Order status is required");
        }

        if (order.getStatus() == OrderStatus.CANCELLED) {
            if (newStatus == OrderStatus.CANCELLED) {
                return order;
            }

            throw new IllegalStateException(
                    "A cancelled order cannot change its status"
            );
        }

        if (newStatus != OrderStatus.CANCELLED) {
            throw new IllegalArgumentException(
                    "Only CANCELLED status is currently supported"
            );
        }

        for (OrderItem item : order.getItems()) {
            inventoryClient.restoreStock(
                    item.getProductId(),
                    item.getQuantity()
            );
        }

        order.setStatus(OrderStatus.CANCELLED);

        return orderRepository.save(order);
    }

    private Order findAccessibleOrder(UUID orderId, UUID buyerUserId, String userRole) {
        if ("ADMIN".equals(userRole)) {
            return orderRepository.findById(orderId)
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Order not found with ID: " + orderId
                    ));
        }

        return orderRepository.findByIdAndBuyerUserId(orderId, buyerUserId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Order not found with ID: " + orderId
                ));
    }

    private String generateOrderNumber() {
        return "ORD-" + UUID.randomUUID()
                .toString()
                .substring(0, 8)
                .toUpperCase();
    }
}