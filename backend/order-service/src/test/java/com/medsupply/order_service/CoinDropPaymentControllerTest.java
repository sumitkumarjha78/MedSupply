package com.medsupply.order_service;

import com.medsupply.order_service.controller.CoinDropPaymentController;
import com.medsupply.order_service.dto.response.OrderValidationResponse;
import com.medsupply.order_service.dto.response.WebhookAckResponse;
import com.medsupply.order_service.entity.OrderStatus;
import com.medsupply.order_service.entity.PaymentStatus;
import com.medsupply.order_service.exception.GlobalExceptionHandler;
import com.medsupply.order_service.exception.InvalidSignatureException;
import com.medsupply.order_service.exception.PaymentConflictException;
import com.medsupply.order_service.service.CoinDropPaymentService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(CoinDropPaymentController.class)
@Import(GlobalExceptionHandler.class)
class CoinDropPaymentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CoinDropPaymentService coinDropPaymentService;

    @Test
    void validateOrder_validRequest_returns200() throws Exception {
        when(coinDropPaymentService.validateOrderForCoinDrop(
                eq("ORD-1001"), eq("client-1"), eq("1700000000"), eq("sig"), eq("/api/payments/coindrop/orders/ORD-1001/validate")))
                .thenReturn(new OrderValidationResponse(
                        "ORD-1001", "hosp-1", "City General Hospital",
                        new BigDecimal("1250.00"), "USD",
                        OrderStatus.PLACED, PaymentStatus.PENDING,
                        "Ananya Rao", "procurement@cityhospital.org"));

        mockMvc.perform(get("/api/payments/coindrop/orders/ORD-1001/validate")
                        .header("X-CLIENT-ID", "client-1")
                        .header("X-TIMESTAMP", "1700000000")
                        .header("X-SIGNATURE", "sig"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.externalOrderId").value("ORD-1001"))
                .andExpect(jsonPath("$.amount").value(1250.00));
    }

    @Test
    void validateOrder_alreadyPaid_returns409() throws Exception {
        when(coinDropPaymentService.validateOrderForCoinDrop(anyString(), anyString(), anyString(), anyString(), anyString()))
                .thenThrow(new PaymentConflictException("Order is already paid"));

        mockMvc.perform(get("/api/payments/coindrop/orders/ORD-PAID/validate")
                        .header("X-CLIENT-ID", "client-1")
                        .header("X-TIMESTAMP", "1700000000")
                        .header("X-SIGNATURE", "sig"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Order is already paid"));
    }

    @Test
    void webhook_invalidSignature_returns401() throws Exception {
        when(coinDropPaymentService.handleWebhook(anyString(), anyString(), anyString(), anyString()))
                .thenThrow(new InvalidSignatureException("Invalid HMAC signature"));

        mockMvc.perform(post("/api/payments/coindrop/webhook")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-TIMESTAMP", "1700000000")
                        .header("X-SIGNATURE", "bad-sig")
                        .content("{\"eventId\":\"e1\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid HMAC signature"));
    }

    @Test
    void webhook_validSignature_returns200() throws Exception {
        when(coinDropPaymentService.handleWebhook(anyString(), anyString(), anyString(), anyString()))
                .thenReturn(new WebhookAckResponse(true, "evt-1", false));

        mockMvc.perform(post("/api/payments/coindrop/webhook")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-TIMESTAMP", "1700000000")
                        .header("X-SIGNATURE", "good-sig")
                        .content("{\"eventId\":\"evt-1\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.received").value(true))
                .andExpect(jsonPath("$.eventId").value("evt-1"));
    }
}