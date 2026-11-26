package com.medsupply.order_service;

import com.medsupply.order_service.client.CoinDropClient;
import com.medsupply.order_service.client.dto.CoinDropCheckoutResponse;
import com.medsupply.order_service.config.CoinDropProperties;
import com.medsupply.order_service.dto.response.CheckoutInitResponse;
import com.medsupply.order_service.dto.response.OrderValidationResponse;
import com.medsupply.order_service.dto.response.WebhookAckResponse;
import com.medsupply.order_service.entity.Order;
import com.medsupply.order_service.entity.OrderStatus;
import com.medsupply.order_service.entity.PaymentStatus;
import com.medsupply.order_service.entity.ProcessedWebhookEvent;
import com.medsupply.order_service.exception.InvalidSignatureException;
import com.medsupply.order_service.exception.PaymentConflictException;
import com.medsupply.order_service.exception.ResourceNotFoundException;
import com.medsupply.order_service.repository.OrderRepository;
import com.medsupply.order_service.repository.ProcessedWebhookEventRepository;
import com.medsupply.order_service.security.HmacSigner;
import com.medsupply.order_service.service.CoinDropPaymentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import tools.jackson.databind.json.JsonMapper;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CoinDropPaymentServiceTest {

    @Mock
    private OrderRepository orderRepository;
    @Mock
    private ProcessedWebhookEventRepository processedWebhookEventRepository;
    @Mock
    private CoinDropClient coinDropClient;

    private CoinDropProperties properties;
    private HmacSigner hmacSigner;
    private CoinDropPaymentService service;

    @BeforeEach
    void setUp() {
        properties = new CoinDropProperties();
        properties.setClientId("medsupply-test");
        properties.setPartnerSecret("partner-secret-123");
        properties.setWebhookSecret("webhook-secret-456");
        properties.setMaxTimestampSkewSeconds(300);
        properties.setOrderExpiryHours(24);

        hmacSigner = new HmacSigner();
        service = new CoinDropPaymentService(
                orderRepository,
                processedWebhookEventRepository,
                coinDropClient,
                properties,
                hmacSigner,
                JsonMapper.builder().build()
        );
    }

    @Test
    void handleWebhook_paymentSuccess_marksOrderPaidAndConfirmed() {
        Order order = sampleOrder("ORD-1001", OrderStatus.PLACED, PaymentStatus.INITIATED, new BigDecimal("1250.00"));
        String path = "/api/payments/coindrop/webhook";
        String body = """
                {
                  "eventId": "evt-success-1",
                  "eventType": "payment.success",
                  "externalOrderId": "ORD-1001",
                  "checkoutSessionId": "1",
                  "paymentId": 99,
                  "amount": 1250.00,
                  "currency": "USD",
                  "status": "SUCCESS",
                  "paymentReference": "pay_rzp_123",
                  "paidAt": "2026-11-24T17:23:00Z"
                }
                """;
        String ts = nowTs();
        String sig = hmacSigner.sign(properties.getWebhookSecret(), ts, "POST", path, body);

        when(processedWebhookEventRepository.existsByEventId("evt-success-1")).thenReturn(false);
        when(orderRepository.findByOrderNumberForUpdate("ORD-1001")).thenReturn(Optional.of(order));

        WebhookAckResponse ack = service.handleWebhook(body, ts, sig, path);

        assertTrue(ack.received());
        assertFalse(ack.duplicate());
        assertEquals(PaymentStatus.PAID, order.getPaymentStatus());
        assertEquals(OrderStatus.CONFIRMED, order.getStatus());
        assertEquals("pay_rzp_123", order.getPaymentReference());
        assertEquals(99L, order.getCoindropPaymentId());
        verify(orderRepository).save(order);
        verify(processedWebhookEventRepository).saveAndFlush(any(ProcessedWebhookEvent.class));
    }

    @Test
    void handleWebhook_paymentFailed_marksUnpaidOrderFailed() {
        Order order = sampleOrder("ORD-1002", OrderStatus.PLACED, PaymentStatus.INITIATED, new BigDecimal("500.00"));
        String path = "/api/payments/coindrop/webhook";
        String body = """
                {
                  "eventId": "evt-fail-1",
                  "eventType": "payment.failed",
                  "externalOrderId": "ORD-1002",
                  "checkoutSessionId": "2",
                  "paymentId": 100,
                  "amount": 500.00,
                  "currency": "USD",
                  "status": "FAILED"
                }
                """;
        String ts = nowTs();
        String sig = hmacSigner.sign(properties.getWebhookSecret(), ts, "POST", path, body);

        when(processedWebhookEventRepository.existsByEventId("evt-fail-1")).thenReturn(false);
        when(orderRepository.findByOrderNumberForUpdate("ORD-1002")).thenReturn(Optional.of(order));

        WebhookAckResponse ack = service.handleWebhook(body, ts, sig, path);

        assertTrue(ack.received());
        assertFalse(ack.duplicate());
        assertEquals(PaymentStatus.FAILED, order.getPaymentStatus());
        assertEquals(OrderStatus.PLACED, order.getStatus());
        verify(orderRepository).save(order);
    }

    @Test
    void handleWebhook_duplicateEvent_isIdempotentNoOp() {
        String path = "/api/payments/coindrop/webhook";
        String body = """
                {
                  "eventId": "evt-dup-1",
                  "eventType": "payment.success",
                  "externalOrderId": "ORD-1001",
                  "amount": 1250.00,
                  "currency": "USD"
                }
                """;
        String ts = nowTs();
        String sig = hmacSigner.sign(properties.getWebhookSecret(), ts, "POST", path, body);

        when(processedWebhookEventRepository.existsByEventId("evt-dup-1")).thenReturn(true);

        WebhookAckResponse ack = service.handleWebhook(body, ts, sig, path);

        assertTrue(ack.received());
        assertTrue(ack.duplicate());
        verifyNoInteractions(orderRepository);
    }

    @Test
    void handleWebhook_failedEventAfterAlreadyPaid_doesNotDowngradeOrder() {
        Order paidOrder = sampleOrder("ORD-1003", OrderStatus.CONFIRMED, PaymentStatus.PAID, new BigDecimal("750.00"));
        String path = "/api/payments/coindrop/webhook";
        String body = """
                {
                  "eventId": "evt-late-fail",
                  "eventType": "payment.failed",
                  "externalOrderId": "ORD-1003",
                  "amount": 750.00,
                  "currency": "USD"
                }
                """;
        String ts = nowTs();
        String sig = hmacSigner.sign(properties.getWebhookSecret(), ts, "POST", path, body);

        when(processedWebhookEventRepository.existsByEventId("evt-late-fail")).thenReturn(false);
        when(orderRepository.findByOrderNumberForUpdate("ORD-1003")).thenReturn(Optional.of(paidOrder));

        WebhookAckResponse ack = service.handleWebhook(body, ts, sig, path);

        assertTrue(ack.received());
        assertEquals(PaymentStatus.PAID, paidOrder.getPaymentStatus());
        assertEquals(OrderStatus.CONFIRMED, paidOrder.getStatus());
        verify(orderRepository, never()).save(any());
        verify(processedWebhookEventRepository).saveAndFlush(any(ProcessedWebhookEvent.class));
    }

    @Test
    void handleWebhook_invalidSignature_throwsUnauthorized() {
        String path = "/api/payments/coindrop/webhook";
        String body = "{\"eventId\":\"evt-bad\",\"eventType\":\"payment.success\",\"externalOrderId\":\"ORD-1001\"}";

        assertThrows(InvalidSignatureException.class, () ->
                service.handleWebhook(body, nowTs(), "deadbeef", path));
        verifyNoInteractions(orderRepository, processedWebhookEventRepository);
    }

    @Test
    void validateOrder_validUnpaidOrder_returnsPersistedDetails() {
        Order order = sampleOrder("ORD-2001", OrderStatus.PLACED, PaymentStatus.PENDING, new BigDecimal("420.50"));
        String path = "/api/payments/coindrop/orders/ORD-2001/validate";
        String ts = nowTs();
        String sig = hmacSigner.sign(properties.getPartnerSecret(), ts, "GET", path, "");

        when(orderRepository.findByOrderNumber("ORD-2001")).thenReturn(Optional.of(order));

        OrderValidationResponse res = service.validateOrderForCoinDrop(
                "ORD-2001", properties.getClientId(), ts, sig, path);

        assertEquals("ORD-2001", res.externalOrderId());
        assertEquals(new BigDecimal("420.50"), res.amount());
        assertEquals("USD", res.currency());
        assertEquals("Ananya Rao", res.customerName());
        assertEquals("procurement@cityhospital.org", res.customerEmail());
    }

    @Test
    void validateOrder_unknownOrder_throwsNotFound() {
        String path = "/api/payments/coindrop/orders/ORD-MISSING/validate";
        String ts = nowTs();
        String sig = hmacSigner.sign(properties.getPartnerSecret(), ts, "GET", path, "");

        when(orderRepository.findByOrderNumber("ORD-MISSING")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () ->
                service.validateOrderForCoinDrop("ORD-MISSING", properties.getClientId(), ts, sig, path));
    }

    @Test
    void validateOrder_alreadyPaidOrCancelled_throwsConflict() {
        Order paidOrder = sampleOrder("ORD-PAID", OrderStatus.CONFIRMED, PaymentStatus.PAID, new BigDecimal("100.00"));
        String paidPath = "/api/payments/coindrop/orders/ORD-PAID/validate";
        String ts = nowTs();
        String paidSig = hmacSigner.sign(properties.getPartnerSecret(), ts, "GET", paidPath, "");
        when(orderRepository.findByOrderNumber("ORD-PAID")).thenReturn(Optional.of(paidOrder));

        assertThrows(PaymentConflictException.class, () ->
                service.validateOrderForCoinDrop("ORD-PAID", properties.getClientId(), ts, paidSig, paidPath));

        Order cancelledOrder = sampleOrder("ORD-CANC", OrderStatus.CANCELLED, PaymentStatus.PENDING, new BigDecimal("100.00"));
        String cancPath = "/api/payments/coindrop/orders/ORD-CANC/validate";
        String cancSig = hmacSigner.sign(properties.getPartnerSecret(), ts, "GET", cancPath, "");
        when(orderRepository.findByOrderNumber("ORD-CANC")).thenReturn(Optional.of(cancelledOrder));

        assertThrows(PaymentConflictException.class, () ->
                service.validateOrderForCoinDrop("ORD-CANC", properties.getClientId(), ts, cancSig, cancPath));
    }

    @Test
    void initiateCheckout_returnsCheckoutUrlAndMarksOrderInitiated() {
        UUID orderId = UUID.randomUUID();
        UUID buyerId = UUID.randomUUID();
        Order order = sampleOrder("ORD-3001", OrderStatus.PLACED, PaymentStatus.PENDING, new BigDecimal("300.00"));
        Instant expiresAt = Instant.now().plusSeconds(900);

        when(orderRepository.findByIdAndBuyerUserId(orderId, buyerId)).thenReturn(Optional.of(order));
        when(coinDropClient.createCheckoutSession("ORD-3001")).thenReturn(
                new CoinDropCheckoutResponse("sess-1", "https://coindrop.test/partner/checkout/tok", "CREATED", expiresAt));

        CheckoutInitResponse res = service.initiateCheckout(orderId, buyerId, "HOSPITAL_BUYER");

        assertEquals("https://coindrop.test/partner/checkout/tok", res.checkoutUrl());
        assertEquals(PaymentStatus.INITIATED, order.getPaymentStatus());
        assertEquals("sess-1", order.getCoindropCheckoutSessionId());
        verify(orderRepository).save(order);
    }

    private Order sampleOrder(String orderNumber, OrderStatus status, PaymentStatus paymentStatus, BigDecimal amount) {
        Order order = new Order();
        order.setOrderNumber(orderNumber);
        order.setHospitalId(UUID.randomUUID());
        order.setFacilityName("City General Hospital");
        order.setBuyerUserId(UUID.randomUUID());
        order.setBuyerName("Ananya Rao");
        order.setBuyerEmail("procurement@cityhospital.org");
        order.setTotalAmount(amount);
        order.setCurrency("USD");
        order.setStatus(status);
        order.setPaymentStatus(paymentStatus);
        return order;
    }

    private String nowTs() {
        return String.valueOf(Instant.now().getEpochSecond());
    }
}