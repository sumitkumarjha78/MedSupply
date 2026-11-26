package com.medsupply.order_service.security;

import com.medsupply.order_service.exception.InvalidSignatureException;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.HexFormat;

@Component
public class HmacSigner {

    private static final String HMAC_SHA256 = "HmacSHA256";

    /**
     * Canonical format: {timestamp}.{METHOD}.{path}.{sha256Hex(body)}
     * Update only this method if CoinDrop specifies a different canonical format.
     */
    public String buildCanonicalPayload(String timestamp, String method, String path, String body) {
        String normalizedMethod = method != null ? method.trim().toUpperCase() : "";
        String normalizedPath = path != null ? path.trim() : "";
        String bodyHash = sha256Hex(body != null ? body : "");
        return timestamp + "." + normalizedMethod + "." + normalizedPath + "." + bodyHash;
    }

    public String sign(String secret, String timestamp, String method, String path, String body) {
        String canonicalPayload = buildCanonicalPayload(timestamp, method, path, body);
        return hmacSha256Hex(secret, canonicalPayload);
    }

    public void verify(
            String secret,
            String timestamp,
            String providedSignature,
            String method,
            String path,
            String rawBody,
            long maxSkewSeconds) {

        if (timestamp == null || timestamp.isBlank()
                || providedSignature == null || providedSignature.isBlank()) {
            throw new InvalidSignatureException("Missing signature or timestamp headers");
        }

        Instant requestTime = parseTimestamp(timestamp);
        long skewSeconds = Math.abs(Instant.now().getEpochSecond() - requestTime.getEpochSecond());
        if (skewSeconds > maxSkewSeconds) {
            throw new InvalidSignatureException("Request timestamp is outside the allowed window");
        }

        String expectedSignature = sign(secret, timestamp.trim(), method, path, rawBody);
        byte[] expectedBytes = expectedSignature.getBytes(StandardCharsets.UTF_8);
        byte[] providedBytes = providedSignature.trim().toLowerCase().getBytes(StandardCharsets.UTF_8);

        if (!MessageDigest.isEqual(expectedBytes, providedBytes)) {
            throw new InvalidSignatureException("Invalid HMAC signature");
        }
    }

    private Instant parseTimestamp(String timestamp) {
        String trimmed = timestamp.trim();
        try {
            long numeric = Long.parseLong(trimmed);
            // Support both epoch seconds and epoch milliseconds
            return trimmed.length() >= 13
                    ? Instant.ofEpochMilli(numeric)
                    : Instant.ofEpochSecond(numeric);
        } catch (NumberFormatException ignored) {
            try {
                return Instant.parse(trimmed);
            } catch (DateTimeParseException ex) {
                throw new InvalidSignatureException("Invalid X-TIMESTAMP format");
            }
        }
    }

    private String hmacSha256Hex(String secret, String payload) {
        try {
            Mac mac = Mac.getInstance(HMAC_SHA256);
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), HMAC_SHA256));
            byte[] digest = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (GeneralSecurityException ex) {
            throw new IllegalStateException("Unable to compute HMAC-SHA256 signature", ex);
        }
    }

    private String sha256Hex(String data) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(data.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (GeneralSecurityException ex) {
            throw new IllegalStateException("Unable to compute SHA-256 hash", ex);
        }
    }
}