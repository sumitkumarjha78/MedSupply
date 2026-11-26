package com.medsupply.order_service.controller;

import com.medsupply.order_service.dto.response.CheckoutInitResponse;
import com.medsupply.order_service.dto.response.OrderValidationResponse;
import com.medsupply.order_service.dto.response.WebhookAckResponse;
import com.medsupply.order_service.service.CoinDropPaymentService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

@RestController
public class CoinDropPaymentController {

    private final CoinDropPaymentService coinDropPaymentService;

    public CoinDropPaymentController(CoinDropPaymentService coinDropPaymentService) {
        this.coinDropPaymentService = coinDropPaymentService;
    }

    // 1. Authenticated customer/admin initiates CoinDrop hosted checkout
    @PostMapping("/api/orders/{id}/payments/coindrop/checkout")
    public ResponseEntity<CheckoutInitResponse> initiateCheckout(
            @PathVariable UUID id,
            @RequestHeader("X-User-Id") UUID buyerUserId,
            @RequestHeader("X-User-Role") String userRole) {

        return ResponseEntity.ok(
                coinDropPaymentService.initiateCheckout(id, buyerUserId, userRole)
        );
    }

    // 2. CoinDrop server-to-server order validation endpoint (HMAC-authenticated)
    @GetMapping("/api/payments/coindrop/orders/{externalOrderId}/validate")
    public ResponseEntity<OrderValidationResponse> validateOrder(
            @PathVariable String externalOrderId,
            @RequestHeader(value = "X-CLIENT-ID", required = false) String clientId,
            @RequestHeader(value = "X-TIMESTAMP", required = false) String timestamp,
            @RequestHeader(value = "X-SIGNATURE", required = false) String signature,
            HttpServletRequest request) {

        return ResponseEntity.ok(
                coinDropPaymentService.validateOrderForCoinDrop(
                        externalOrderId,
                        clientId,
                        timestamp,
                        signature,
                        request.getRequestURI()
                )
        );
    }

    // 3. CoinDrop signed webhook receiver (raw bytes preserved for HMAC verification)
    @PostMapping("/api/payments/coindrop/webhook")
    public ResponseEntity<WebhookAckResponse> handleWebhook(
            @RequestBody byte[] rawBodyBytes,
            @RequestHeader(value = "X-TIMESTAMP", required = false) String timestamp,
            @RequestHeader(value = "X-SIGNATURE", required = false) String signature,
            HttpServletRequest request) {

        String rawBody = new String(rawBodyBytes, StandardCharsets.UTF_8);
        return ResponseEntity.ok(
                coinDropPaymentService.handleWebhook(
                        rawBody,
                        timestamp,
                        signature,
                        request.getRequestURI()
                )
        );
    }
}