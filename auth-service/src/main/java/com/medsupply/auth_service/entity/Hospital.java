package com.medsupply.auth_service.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "hospitals")
@Getter
@Setter
@NoArgsConstructor
public class Hospital {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "hospital_name", nullable = false, length = 150)
    private String hospitalName;

    @Column(name = "representative_first_name", nullable = false, length = 60)
    private String representativeFirstName;

    @Column(name = "representative_last_name", nullable = false, length = 60)
    private String representativeLastName;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Hospital(
            String hospitalName,
            String representativeFirstName,
            String representativeLastName,
            String email,
            User user) {
        this.hospitalName = hospitalName;
        this.representativeFirstName = representativeFirstName;
        this.representativeLastName = representativeLastName;
        this.email = email;
        this.user = user;
    }
}