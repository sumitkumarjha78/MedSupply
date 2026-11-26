package com.medsupply.order_service.entity;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
        name = "processed_webhook_events",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_processed_webhook_event_id",
                        columnNames = "event_id"
                )
        }
)
public class ProcessedWebhookEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "event_id", nullable = false, unique = true, length = 150)
    private String eventId;

    @Column(name = "event_type", nullable = false, length = 60)
    private String eventType;

    @Column(name = "external_order_id", nullable = false, length = 60)
    private String externalOrderId;

    @Column(name = "outcome", nullable = false, length = 60)
    private String outcome;

    @Column(name = "processed_at", nullable = false, updatable = false)
    private Instant processedAt;

    public ProcessedWebhookEvent() {
    }

    public ProcessedWebhookEvent(
            String eventId,
            String eventType,
            String externalOrderId,
            String outcome) {
        this.eventId = eventId;
        this.eventType = eventType;
        this.externalOrderId = externalOrderId;
        this.outcome = outcome;
    }

    @PrePersist
    protected void onCreate() {
        this.processedAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public String getEventId() {
        return eventId;
    }

    public String getEventType() {
        return eventType;
    }

    public String getExternalOrderId() {
        return externalOrderId;
    }

    public String getOutcome() {
        return outcome;
    }

    public Instant getProcessedAt() {
        return processedAt;
    }
}