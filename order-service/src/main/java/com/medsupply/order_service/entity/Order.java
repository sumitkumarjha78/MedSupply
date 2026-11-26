package com.medsupply.order_service.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String orderNumber;

    @Column(nullable = false)
    private String facilityName;

    @Column(name = "hospital_id")
    private UUID hospitalId;

    @Column(nullable = false)
    private UUID buyerUserId;

    @Column(name = "buyer_name", length = 120)
    private String buyerName;

    @Column(name = "buyer_email", length = 150)
    private String buyerEmail;

    @OneToMany(
            mappedBy = "order",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private List<OrderItem> items = new ArrayList<>();

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "currency", length = 10)
    private String currency = "USD";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", length = 20)
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;

    @Column(name = "coindrop_checkout_session_id", length = 100)
    private String coindropCheckoutSessionId;

    @Column(name = "coindrop_payment_id")
    private Long coindropPaymentId;

    @Column(name = "payment_reference", length = 150)
    private String paymentReference;

    @Column(name = "paid_at")
    private Instant paidAt;

    @Column(name = "checkout_expires_at")
    private Instant checkoutExpiresAt;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    public Order() {
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
        if (this.currency == null || this.currency.isBlank()) {
            this.currency = "USD";
        }
        if (this.paymentStatus == null) {
            this.paymentStatus = PaymentStatus.PENDING;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public void addItem(OrderItem item) {
        items.add(item);
        item.setOrder(this);
    }

    public UUID getId() {
        return id;
    }

    public String getOrderNumber() {
        return orderNumber;
    }

    public void setOrderNumber(String orderNumber) {
        this.orderNumber = orderNumber;
    }

    public String getFacilityName() {
        return facilityName;
    }

    public void setFacilityName(String facilityName) {
        this.facilityName = facilityName;
    }

    public UUID getHospitalId() {
        return hospitalId;
    }

    public void setHospitalId(UUID hospitalId) {
        this.hospitalId = hospitalId;
    }

    public UUID getBuyerUserId() {
        return buyerUserId;
    }

    public void setBuyerUserId(UUID buyerUserId) {
        this.buyerUserId = buyerUserId;
    }

    public String getBuyerName() {
        return buyerName;
    }

    public void setBuyerName(String buyerName) {
        this.buyerName = buyerName;
    }

    public String getBuyerEmail() {
        return buyerEmail;
    }

    public void setBuyerEmail(String buyerEmail) {
        this.buyerEmail = buyerEmail;
    }

    public List<OrderItem> getItems() {
        return items;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public String getCurrency() {
        return currency != null ? currency : "USD";
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public OrderStatus getStatus() {
        return status;
    }

    public void setStatus(OrderStatus status) {
        this.status = status;
    }

    public PaymentStatus getPaymentStatus() {
        return paymentStatus != null ? paymentStatus : PaymentStatus.PENDING;
    }

    public void setPaymentStatus(PaymentStatus paymentStatus) {
        this.paymentStatus = paymentStatus;
    }

    public String getCoindropCheckoutSessionId() {
        return coindropCheckoutSessionId;
    }

    public void setCoindropCheckoutSessionId(String coindropCheckoutSessionId) {
        this.coindropCheckoutSessionId = coindropCheckoutSessionId;
    }

    public Long getCoindropPaymentId() {
        return coindropPaymentId;
    }

    public void setCoindropPaymentId(Long coindropPaymentId) {
        this.coindropPaymentId = coindropPaymentId;
    }

    public String getPaymentReference() {
        return paymentReference;
    }

    public void setPaymentReference(String paymentReference) {
        this.paymentReference = paymentReference;
    }

    public Instant getPaidAt() {
        return paidAt;
    }

    public void setPaidAt(Instant paidAt) {
        this.paidAt = paidAt;
    }

    public Instant getCheckoutExpiresAt() {
        return checkoutExpiresAt;
    }

    public void setCheckoutExpiresAt(Instant checkoutExpiresAt) {
        this.checkoutExpiresAt = checkoutExpiresAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}