package com.medsupply.auth_service.dto.response;

import com.medsupply.auth_service.entity.Role;
import java.util.UUID;

public record AuthResponse(
        String token,
        UUID userId,
        String email,
        Role role
) {}