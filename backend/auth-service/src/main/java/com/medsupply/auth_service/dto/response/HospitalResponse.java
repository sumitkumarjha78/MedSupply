package com.medsupply.auth_service.dto.response;

import java.time.LocalDateTime;
import java.util.UUID;

public record HospitalResponse(
        UUID id,
        UUID userId,
        String hospitalName,
        String representativeFirstName,
        String representativeLastName,
        String email,
        LocalDateTime createdAt
) {}