package com.medsupply.order_service.client;

import com.medsupply.order_service.client.dto.CoinDropCheckoutRequest;
import com.medsupply.order_service.client.dto.CoinDropCheckoutResponse;
import com.medsupply.order_service.config.CoinDropProperties;
import com.medsupply.order_service.exception.ExternalServiceException;
import com.medsupply.order_service.security.HmacSigner;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import tools.jackson.databind.json.JsonMapper;

import java.time.Instant;

@Component
public class CoinDropClient {

    private static final Logger log = LoggerFactory.getLogger(CoinDropClient.class);
    private static final String CHECKOUT_SESSIONS_PATH = "/api/partner/v1/checkout-sessions";

    private final RestClient coindropRestClient;
    private final CoinDropProperties properties;
    private final HmacSigner hmacSigner;
    private final JsonMapper jsonMapper;

    public CoinDropClient(
            @Qualifier("coindropRestClient") RestClient coindropRestClient,
            CoinDropProperties properties,
            HmacSigner hmacSigner,
            JsonMapper jsonMapper) {
        this.coindropRestClient = coindropRestClient;
        this.properties = properties;
        this.hmacSigner = hmacSigner;
        this.jsonMapper = jsonMapper;
    }

    public CoinDropCheckoutResponse createCheckoutSession(String externalOrderId) {
        String rawBody = jsonMapper.writeValueAsString(new CoinDropCheckoutRequest(externalOrderId));
        String timestamp = String.valueOf(Instant.now().getEpochSecond());
        String signature = hmacSigner.sign(
                properties.getPartnerSecret(),
                timestamp,
                "POST",
                CHECKOUT_SESSIONS_PATH,
                rawBody
        );

        try {
            CoinDropCheckoutResponse response = coindropRestClient.post()
                    .uri(CHECKOUT_SESSIONS_PATH)
                    .contentType(MediaType.APPLICATION_JSON)
                    .header("X-CLIENT-ID", properties.getClientId())
                    .header("X-TIMESTAMP", timestamp)
                    .header("X-SIGNATURE", signature)
                    .header("ngrok-skip-browser-warning", "true")
                    .body(rawBody)
                    .retrieve()
                    .body(CoinDropCheckoutResponse.class);

            if (response == null || response.checkoutUrl() == null || response.checkoutUrl().isBlank()) {
                throw new ExternalServiceException("CoinDrop returned an invalid checkout session response");
            }

            return response;

        } catch (RestClientResponseException ex) {
            log.error("CoinDrop HTTP error: status={} body={}",
                    ex.getStatusCode().value(), ex.getResponseBodyAsString());
            throw new ExternalServiceException(
                    "CoinDrop returned HTTP " + ex.getStatusCode().value(), ex);
        } catch (RestClientException ex) {
            log.error("CoinDrop client/deserialization error: {}", ex.getMessage(), ex);
            throw new ExternalServiceException("CoinDrop payment service is unavailable", ex);
        }
    }
}