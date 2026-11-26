package com.medsupply.auth_service.repository;

import com.medsupply.auth_service.entity.Hospital;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface HospitalRepository extends JpaRepository<Hospital, UUID> {
    Optional<Hospital> findByUserId(UUID userId);
}