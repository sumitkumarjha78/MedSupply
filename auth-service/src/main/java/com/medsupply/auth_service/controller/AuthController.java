package com.medsupply.auth_service.controller;


import com.medsupply.auth_service.dto.request.LoginRequest;
import com.medsupply.auth_service.dto.request.RegisterRequest;
import com.medsupply.auth_service.dto.response.AuthResponse;
import com.medsupply.auth_service.dto.response.UserResponse;
import com.medsupply.auth_service.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> me(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        return ResponseEntity.ok(authService.getCurrentUser(authHeader));
    }
}