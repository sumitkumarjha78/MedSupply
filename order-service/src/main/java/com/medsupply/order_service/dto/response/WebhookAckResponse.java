package com.medsupply.order_service.dto.response;

public record WebhookAckResponse(
        boolean received,
        String eventId,
        boolean duplicate
) {}