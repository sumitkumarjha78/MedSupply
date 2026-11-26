package com.medsupply.order_service.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "coindrop")
public class CoinDropProperties {

    private String baseUrl = "http://localhost:8083";
    private String clientId = "medsupply-local";
    private String partnerSecret = "change-me-partner-secret";
    private String webhookSecret = "change-me-webhook-secret";
    private long maxTimestampSkewSeconds = 300;
    private long orderExpiryHours = 24;

    public String getBaseUrl() {
        return baseUrl;
    }

    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl;
    }

    public String getClientId() {
        return clientId;
    }

    public void setClientId(String clientId) {
        this.clientId = clientId;
    }

    public String getPartnerSecret() {
        return partnerSecret;
    }

    public void setPartnerSecret(String partnerSecret) {
        this.partnerSecret = partnerSecret;
    }

    public String getWebhookSecret() {
        return webhookSecret;
    }

    public void setWebhookSecret(String webhookSecret) {
        this.webhookSecret = webhookSecret;
    }

    public long getMaxTimestampSkewSeconds() {
        return maxTimestampSkewSeconds;
    }

    public void setMaxTimestampSkewSeconds(long maxTimestampSkewSeconds) {
        this.maxTimestampSkewSeconds = maxTimestampSkewSeconds;
    }

    public long getOrderExpiryHours() {
        return orderExpiryHours;
    }

    public void setOrderExpiryHours(long orderExpiryHours) {
        this.orderExpiryHours = orderExpiryHours;
    }
}