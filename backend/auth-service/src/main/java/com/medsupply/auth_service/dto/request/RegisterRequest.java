package com.medsupply.auth_service.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "First name is required")
        @Size(max = 60, message = "First name must be at most 60 characters")
        String firstName,

        @NotBlank(message = "Second name is required")
        @Size(max = 60, message = "Second name must be at most 60 characters")
        String lastName,

        @NotBlank(message = "Hospital name is required")
        @Size(max = 150, message = "Hospital name must be at most 150 characters")
        String hospitalName,

        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        String email,

        @NotBlank(message = "Password is required")
        @Size(min = 6, message = "Password must be at least 6 characters")
        String password,

        @NotBlank(message = "Confirm password is required")
        @Size(min = 6, message = "Confirm password must be at least 6 characters")
        String confirmPassword
) {}