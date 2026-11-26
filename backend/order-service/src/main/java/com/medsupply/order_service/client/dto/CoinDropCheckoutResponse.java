package com.medsupply.order_service.client.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;

@JsonIgnoreProperties(ignoreUnknown = true)
public record CoinDropCheckoutResponse(
        String checkoutSessionId,
        String checkoutUrl,
        String status,
        String expiresAt
) {
    public Instant expiresAtAsInstant() {
        if (expiresAt == null || expiresAt.isBlank()) {
            return null;
        }
        String value = expiresAt.trim();
        try {
            return Instant.parse(value);
        } catch (DateTimeParseException ignored) {
        }
        try {
            return OffsetDateTime.parse(value).toInstant();
        } catch (DateTimeParseException ignored) {
        }
        try {
            return LocalDateTime.parse(value)
                    .atZone(ZoneId.systemDefault())
                    .toInstant();
        } catch (DateTimeParseException ignored) {
            return null;
        }
    }
}
