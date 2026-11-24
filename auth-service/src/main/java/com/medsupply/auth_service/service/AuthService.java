package com.medsupply.auth_service.service;


import com.medsupply.auth_service.config.JwtUtil;
import com.medsupply.auth_service.dto.request.LoginRequest;
import com.medsupply.auth_service.dto.request.RegisterRequest;
import com.medsupply.auth_service.dto.response.AuthResponse;
import com.medsupply.auth_service.dto.response.UserResponse;
import com.medsupply.auth_service.entity.User;
import com.medsupply.auth_service.exception.DuplicateEmailException;
import com.medsupply.auth_service.exception.InvalidCredentialsException;
import com.medsupply.auth_service.repository.UserRepository;
import io.jsonwebtoken.Claims;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    public UserResponse register(RegisterRequest request) {
        String normalizedEmail = request.email().trim().toLowerCase();
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new DuplicateEmailException("Email already registered: " + normalizedEmail);
        }

        User user = new User(
                request.name().trim(),
                normalizedEmail,
                passwordEncoder.encode(request.password()),
                request.role()
        );
        return toUserResponse(userRepository.save(user));
    }

    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = request.email().trim().toLowerCase();
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new InvalidCredentialsException("Invalid email or password"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new InvalidCredentialsException("Invalid email or password");
        }

        String token = jwtUtil.generateToken(user);
        return new AuthResponse(token, user.getId(), user.getEmail(), user.getRole());
    }

    public UserResponse getCurrentUser(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new InvalidCredentialsException("Missing or invalid Authorization header");
        }
        String token = authHeader.substring(7);
        Claims claims = jwtUtil.parseClaims(token);

        User user = userRepository.findByEmail(claims.getSubject())
                .orElseThrow(() -> new InvalidCredentialsException("User not found"));
        return toUserResponse(user);
    }

    private UserResponse toUserResponse(User user) {
        return new UserResponse(user.getId(), user.getName(), user.getEmail(), user.getRole(), user.getCreatedAt());
    }
}