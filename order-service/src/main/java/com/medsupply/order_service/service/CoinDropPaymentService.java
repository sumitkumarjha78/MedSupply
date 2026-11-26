package com.medsupply.order_service.service;

import com.medsupply.order_service.client.CoinDropClient;
import com.medsupply.order_service.client.dto.CoinDropCheckoutResponse;
import com.medsupply.order_service.config.CoinDropProperties;
import com.medsupply.order_service.dto.request.CoinDropWebhookEvent;
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
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.json.JsonMapper;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
public class CoinDropPaymentService {

    private final OrderRepository orderRepository;
    private final ProcessedWebhookEventRepository processedWebhookEventRepository;
    private final CoinDropClient coinDropClient;
    private final CoinDropProperties properties;
    private final HmacSigner hmacSigner;
    private final JsonMapper jsonMapper;

    public CoinDropPaymentService(
            OrderRepository orderRepository,
            ProcessedWebhookEventRepository processedWebhookEventRepository,
            CoinDropClient coinDropClient,
            CoinDropProperties properties,
            HmacSigner hmacSigner,
            JsonMapper jsonMapper) {
        this.orderRepository = orderRepository;
        this.processedWebhookEventRepository = processedWebhookEventRepository;
        this.coinDropClient = coinDropClient;
        this.properties = properties;
        this.hmacSigner = hmacSigner;
        this.jsonMapper = jsonMapper;
    }

    @Transactional(readOnly = true)
    public OrderValidationResponse validateOrderForCoinDrop(
            String externalOrderId,
            String clientId,
            String timestamp,
            String signature,
            String requestPath) {

        verifyPartnerClient(clientId);
        hmacSigner.verify(
                properties.getPartnerSecret(),
                timestamp,
                signature,
                "GET",
                requestPath,
                "",
                properties.getMaxTimestampSkewSeconds()
        );

        Order order = orderRepository.findByOrderNumber(externalOrderId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Order not found with number: " + externalOrderId));

        ensureOrderPayable(order);

        String hospitalReference = order.getHospitalId() != null
                ? order.getHospitalId().toString()
                : order.getFacilityName();

        return new OrderValidationResponse(
                order.getOrderNumber(),
                hospitalReference,
                order.getFacilityName(),
                order.getTotalAmount(),
                order.getCurrency(),
                order.getStatus(),
                order.getPaymentStatus(),
                order.getBuyerName() != null ? order.getBuyerName() : order.getFacilityName(),
                order.getBuyerEmail() != null ? order.getBuyerEmail() : ""
        );
    }

    @Transactional
    public CheckoutInitResponse initiateCheckout(UUID orderId, UUID buyerUserId, String userRole) {
        Order order = findAccessibleOrder(orderId, buyerUserId, userRole);
        ensureOrderPayable(order);

        CoinDropCheckoutResponse session = coinDropClient.createCheckoutSession(order.getOrderNumber());
        Instant expiresAt = session.expiresAtAsInstant();

        order.setPaymentStatus(PaymentStatus.INITIATED);
        order.setCoindropCheckoutSessionId(session.checkoutSessionId());
        order.setCheckoutExpiresAt(expiresAt);
        orderRepository.save(order);

        return new CheckoutInitResponse(
                order.getId(),
                order.getOrderNumber(),
                session.checkoutSessionId(),
                session.checkoutUrl(),
                session.status(),
                expiresAt
        );
    }
    @Transactional
    public WebhookAckResponse handleWebhook(
            String rawBody,
            String timestamp,
            String signature,
            String requestPath) {

        hmacSigner.verify(
                properties.getWebhookSecret(),
                timestamp,
                signature,
                "POST",
                requestPath,
                rawBody,
                properties.getMaxTimestampSkewSeconds()
        );

        CoinDropWebhookEvent event = parseWebhookEvent(rawBody);

        if (isBlank(event.eventId()) || isBlank(event.eventType()) || isBlank(event.externalOrderId())) {
            throw new IllegalArgumentException("Webhook payload missing required eventId, eventType, or externalOrderId");
        }

        if (processedWebhookEventRepository.existsByEventId(event.eventId())) {
            return new WebhookAckResponse(true, event.eventId(), true);
        }

        Order order = orderRepository.findByOrderNumberForUpdate(event.externalOrderId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Order not found with number: " + event.externalOrderId()));

        String normalizedEventType = event.eventType().trim().toLowerCase();
        if (!"payment.success".equals(normalizedEventType)
                && !"payment.failed".equals(normalizedEventType)) {
            throw new IllegalArgumentException("Unsupported CoinDrop webhook event type: " + event.eventType());
        }

        // Never let a duplicate or failed event alter an already-paid order
        if (order.getPaymentStatus() == PaymentStatus.PAID) {
            return recordProcessedEvent(event, "IGNORED_ALREADY_PAID");
        }

        if ("payment.success".equals(normalizedEventType)) {
            validateAmountAndCurrency(order, event);

            if (order.getStatus() == OrderStatus.CANCELLED) {
                return recordProcessedEvent(event, "IGNORED_ORDER_CANCELLED");
            }

            order.setPaymentStatus(PaymentStatus.PAID);
            order.setStatus(OrderStatus.CONFIRMED);
            if (event.checkoutSessionId() != null) {
                order.setCoindropCheckoutSessionId(event.checkoutSessionId());
            }
            if (event.paymentId() != null) {
                order.setCoindropPaymentId(event.paymentId());
            }
            if (event.paymentReference() != null) {
                order.setPaymentReference(event.paymentReference());
            }
            order.setPaidAt(event.paidAt() != null ? event.paidAt() : Instant.now());
            orderRepository.save(order);

            return recordProcessedEvent(event, "APPLIED_PAID");
        }

        // payment.failed on an unpaid order
        if (order.getStatus() != OrderStatus.CANCELLED) {
            order.setPaymentStatus(PaymentStatus.FAILED);
            orderRepository.save(order);
            return recordProcessedEvent(event, "APPLIED_FAILED");
        }

        return recordProcessedEvent(event, "IGNORED_ORDER_CANCELLED");
    }

    private WebhookAckResponse recordProcessedEvent(CoinDropWebhookEvent event, String outcome) {
        try {
            processedWebhookEventRepository.saveAndFlush(new ProcessedWebhookEvent(
                    event.eventId().trim(),
                    event.eventType().trim(),
                    event.externalOrderId().trim(),
                    outcome
            ));
            return new WebhookAckResponse(true, event.eventId(), false);
        } catch (DataIntegrityViolationException ex) {
            return new WebhookAckResponse(true, event.eventId(), true);
        }
    }

    private void validateAmountAndCurrency(Order order, CoinDropWebhookEvent event) {
        if (event.amount() == null || order.getTotalAmount().compareTo(event.amount()) != 0) {
            throw new IllegalArgumentException("Webhook amount does not match persisted order amount");
        }
        if (event.currency() == null || !order.getCurrency().equalsIgnoreCase(event.currency().trim())) {
            throw new IllegalArgumentException("Webhook currency does not match persisted order currency");
        }
    }

    private void ensureOrderPayable(Order order) {
        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new PaymentConflictException("Cancelled order cannot be paid");
        }
        if (order.getPaymentStatus() == PaymentStatus.PAID) {
            throw new PaymentConflictException("Order is already paid");
        }
        if (isOrderExpired(order)) {
            throw new PaymentConflictException("Order payment window has expired");
        }
    }

    private boolean isOrderExpired(Order order) {
        if (order.getCreatedAt() == null || properties.getOrderExpiryHours() <= 0) {
            return false;
        }
        Instant expiryCutoff = order.getCreatedAt().plus(properties.getOrderExpiryHours(), ChronoUnit.HOURS);
        return Instant.now().isAfter(expiryCutoff);
    }

    private void verifyPartnerClient(String clientId) {
        if (isBlank(clientId) || !properties.getClientId().equals(clientId.trim())) {
            throw new InvalidSignatureException("Invalid X-CLIENT-ID header");
        }
    }

    private CoinDropWebhookEvent parseWebhookEvent(String rawBody) {
        try {
            return jsonMapper.readValue(rawBody, CoinDropWebhookEvent.class);
        } catch (JacksonException ex) {
            throw new IllegalArgumentException("Invalid CoinDrop webhook JSON payload");
        }
    }

    private Order findAccessibleOrder(UUID orderId, UUID buyerUserId, String userRole) {
        if ("ADMIN".equals(userRole)) {
            return orderRepository.findById(orderId)
                    .orElseThrow(() -> new ResourceNotFoundException("Order not found with ID: " + orderId));
        }
        return orderRepository.findByIdAndBuyerUserId(orderId, buyerUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with ID: " + orderId));
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}