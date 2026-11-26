package com.medsupply.order_service;

import com.medsupply.order_service.exception.InvalidSignatureException;
import com.medsupply.order_service.security.HmacSigner;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;

class HmacSignerTest {

    private final HmacSigner signer = new HmacSigner();

    @Test
    void verify_validSignature_succeeds() {
        String ts = String.valueOf(Instant.now().getEpochSecond());
        String body = "{\"externalOrderId\":\"ORD-1001\"}";
        String sig = signer.sign("test-secret", ts, "POST", "/api/payments/coindrop/webhook", body);

        assertDoesNotThrow(() -> signer.verify(
                "test-secret", ts, sig, "POST", "/api/payments/coindrop/webhook", body, 300));
    }

    @Test
    void verify_tamperedBody_throwsInvalidSignature() {
        String ts = String.valueOf(Instant.now().getEpochSecond());
        String sig = signer.sign("test-secret", ts, "POST", "/api/payments/coindrop/webhook", "{\"amount\":100}");

        assertThrows(InvalidSignatureException.class, () -> signer.verify(
                "test-secret", ts, sig, "POST", "/api/payments/coindrop/webhook", "{\"amount\":1}", 300));
    }

    @Test
    void verify_expiredTimestamp_throwsInvalidSignature() {
        String expiredTs = String.valueOf(Instant.now().minusSeconds(600).getEpochSecond());
        String sig = signer.sign("test-secret", expiredTs, "GET", "/api/payments/coindrop/orders/ORD-1/validate", "");

        assertThrows(InvalidSignatureException.class, () -> signer.verify(
                "test-secret", expiredTs, sig, "GET", "/api/payments/coindrop/orders/ORD-1/validate", "", 300));
    }
}