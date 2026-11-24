package com.medsupply.auth_service.controller;

import com.medsupply.auth_service.dto.response.HospitalResponse;
import com.medsupply.auth_service.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/internal/hospitals")
public class InternalHospitalController {

    private final AuthService authService;

    public InternalHospitalController(AuthService authService) {
        this.authService = authService;
    }

    @GetMapping("/by-user/{userId}")
    public ResponseEntity<HospitalResponse> getHospitalByUserId(@PathVariable UUID userId) {
        return ResponseEntity.ok(authService.getHospitalByUserId(userId));
    }
}