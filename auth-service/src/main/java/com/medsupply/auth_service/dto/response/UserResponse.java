package com.medsupply.auth_service.dto.response;

import com.medsupply.auth_service.entity.Role;
import java.time.LocalDateTime;
import java.util.UUID;

public record UserResponse(
        UUID id,
        String name,
        String email,
        Role role,
        LocalDateTime createdAt
) {}