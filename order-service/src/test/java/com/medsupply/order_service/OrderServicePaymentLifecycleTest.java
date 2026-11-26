package com.medsupply.order_service;

import com.medsupply.order_service.client.HospitalClient;
import com.medsupply.order_service.client.InventoryClient;
import com.medsupply.order_service.client.ProductClient;

import com.medsupply.order_service.client.dto.InventoryResponse;
import com.medsupply.order_service.client.dto.ProductResponse;
import com.medsupply.order_service.dto.request.OrderItemRequest;
import com.medsupply.order_service.dto.request.OrderRequest;
import com.medsupply.order_service.dto.response.HospitalResponse;
import com.medsupply.order_service.entity.Order;
import com.medsupply.order_service.entity.OrderItem;
import com.medsupply.order_service.entity.OrderStatus;
import com.medsupply.order_service.entity.PaymentStatus;
import com.medsupply.order_service.repository.OrderRepository;
import com.medsupply.order_service.service.OrderService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServicePaymentLifecycleTest {

    @Mock
    private OrderRepository orderRepository;
    @Mock
    private ProductClient productClient;
    @Mock
    private InventoryClient inventoryClient;
    @Mock
    private HospitalClient hospitalClient;

    private OrderService orderService;

    @BeforeEach
    void setUp() {
        orderService = new OrderService(
                orderRepository,
                productClient,
                inventoryClient,
                hospitalClient,
                "USD"
        );
    }

    @Test
    void createOrder_forHospitalBuyer_setsPlacedPendingAndSnapshotsBuyerDetails() {
        UUID buyerId = UUID.randomUUID();
        UUID hospitalId = UUID.randomUUID();
        UUID productId = UUID.randomUUID();

        when(hospitalClient.getHospitalByUserId(buyerId)).thenReturn(
                new HospitalResponse(
                        hospitalId,
                        buyerId,
                        "City General Hospital",
                        "Ananya",
                        "Rao",
                        "procurement@cityhospital.org",
                        LocalDateTime.now()
                )
        );
        when(productClient.getProductById(productId)).thenReturn(
                new ProductResponse(
                        productId,
                        "Surgical Gloves",
                        "MED-GLV-001",
                        "Sterile gloves",
                        "PPE",
                        new BigDecimal("25.00"),
                        "BOX",
                        true,
                        LocalDateTime.now(),
                        LocalDateTime.now()
                )
        );
        when(inventoryClient.getInventoryByProductId(productId)).thenReturn(
                new InventoryResponse(UUID.randomUUID(), productId, 50, Instant.now())
        );
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        OrderItemRequest itemReq = new OrderItemRequest();
        itemReq.setProductId(productId);
        itemReq.setQuantity(4);

        OrderRequest req = new OrderRequest();
        req.setItems(List.of(itemReq));

        Order saved = orderService.createOrder(req, buyerId, "HOSPITAL_BUYER", "procurement@cityhospital.org");

        assertEquals(OrderStatus.PLACED, saved.getStatus());
        assertEquals(PaymentStatus.PENDING, saved.getPaymentStatus());
        assertEquals("USD", saved.getCurrency());
        assertEquals(new BigDecimal("100.00"), saved.getTotalAmount());
        assertEquals(hospitalId, saved.getHospitalId());
        assertEquals("City General Hospital", saved.getFacilityName());
        assertEquals("Ananya Rao", saved.getBuyerName());
        assertEquals("procurement@cityhospital.org", saved.getBuyerEmail());
        verify(inventoryClient).deductStock(productId, 4);
    }

    @Test
    void updateOrderStatus_cancelPaidOrder_throwsConflictAndDoesNotRestoreStock() {
        UUID orderId = UUID.randomUUID();
        UUID buyerId = UUID.randomUUID();

        Order paidOrder = new Order();
        paidOrder.setStatus(OrderStatus.CONFIRMED);
        paidOrder.setPaymentStatus(PaymentStatus.PAID);

        when(orderRepository.findByIdAndBuyerUserId(orderId, buyerId))
                .thenReturn(Optional.of(paidOrder));

        IllegalStateException ex = assertThrows(
                IllegalStateException.class,
                () -> orderService.updateOrderStatus(orderId, OrderStatus.CANCELLED, buyerId, "HOSPITAL_BUYER")
        );

        assertTrue(ex.getMessage().toLowerCase().contains("paid"));
        verifyNoInteractions(inventoryClient);
        verify(orderRepository, never()).save(any());
    }

    @Test
    void updateOrderStatus_cancelUnpaidOrder_restoresStockAndMarksCancelled() {
        UUID orderId = UUID.randomUUID();
        UUID buyerId = UUID.randomUUID();
        UUID productId = UUID.randomUUID();

        Order unpaidOrder = new Order();
        unpaidOrder.setStatus(OrderStatus.PLACED);
        unpaidOrder.setPaymentStatus(PaymentStatus.PENDING);

        OrderItem item = new OrderItem();
        item.setProductId(productId);
        item.setQuantity(3);
        unpaidOrder.addItem(item);

        when(orderRepository.findByIdAndBuyerUserId(orderId, buyerId))
                .thenReturn(Optional.of(unpaidOrder));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        Order updated = orderService.updateOrderStatus(orderId, OrderStatus.CANCELLED, buyerId, "HOSPITAL_BUYER");

        assertEquals(OrderStatus.CANCELLED, updated.getStatus());
        verify(inventoryClient).restoreStock(productId, 3);
    }
}