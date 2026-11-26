package com.medsupply.auth_service.service;

import com.medsupply.auth_service.config.JwtUtil;
import com.medsupply.auth_service.dto.request.CreateStaffRequest;
import com.medsupply.auth_service.dto.request.LoginRequest;
import com.medsupply.auth_service.dto.request.RegisterRequest;
import com.medsupply.auth_service.dto.response.AuthResponse;
import com.medsupply.auth_service.dto.response.HospitalResponse;
import com.medsupply.auth_service.dto.response.UserResponse;
import com.medsupply.auth_service.entity.Hospital;
import com.medsupply.auth_service.entity.Role;
import com.medsupply.auth_service.entity.User;
import com.medsupply.auth_service.exception.DuplicateEmailException;
import com.medsupply.auth_service.exception.HospitalNotFoundException;
import com.medsupply.auth_service.exception.InvalidCredentialsException;
import com.medsupply.auth_service.repository.HospitalRepository;
import com.medsupply.auth_service.repository.UserRepository;
import io.jsonwebtoken.Claims;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final HospitalRepository hospitalRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(
            UserRepository userRepository,
            HospitalRepository hospitalRepository,
            PasswordEncoder passwordEncoder,
            JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.hospitalRepository = hospitalRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    @Transactional
    public UserResponse register(RegisterRequest request) {
        if (!request.password().equals(request.confirmPassword())) {
            throw new IllegalArgumentException("Password and confirm password do not match");
        }

        String normalizedEmail = request.email().trim().toLowerCase();
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new DuplicateEmailException("Email already registered: " + normalizedEmail);
        }

        String firstName = request.firstName().trim();
        String lastName = request.lastName().trim();
        String fullName = firstName + " " + lastName;

        User savedUser = userRepository.save(new User(
                fullName,
                normalizedEmail,
                passwordEncoder.encode(request.password()),
                Role.HOSPITAL_BUYER
        ));

        Hospital savedHospital = hospitalRepository.save(new Hospital(
                request.hospitalName().trim(),
                firstName,
                lastName,
                normalizedEmail,
                savedUser
        ));

        return toUserResponse(savedUser, savedHospital);
    }

    @Transactional
    public UserResponse createStaffUser(String authHeader, CreateStaffRequest request) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new InvalidCredentialsException("Missing or invalid Authorization header");
        }

        Claims claims = jwtUtil.parseClaims(authHeader.substring(7));
        String callerRole = claims.get("role", String.class);

        if (!Role.ADMIN.name().equals(callerRole)) {
            throw new InvalidCredentialsException("Only ADMIN users can create staff accounts");
        }

        if (request.role() != Role.ADMIN && request.role() != Role.INVENTORY_MANAGER) {
            throw new IllegalArgumentException("Staff role must be ADMIN or INVENTORY_MANAGER");
        }

        String normalizedEmail = request.email().trim().toLowerCase();
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new DuplicateEmailException("Email already registered: " + normalizedEmail);
        }

        User savedUser = userRepository.save(new User(
                request.name().trim(),
                normalizedEmail,
                passwordEncoder.encode(request.password()),
                request.role()
        ));

        return toUserResponse(savedUser, null);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = request.email().trim().toLowerCase();
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new InvalidCredentialsException("Invalid email or password"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new InvalidCredentialsException("Invalid email or password");
        }

        Hospital hospital = null;
        if (user.getRole() == Role.HOSPITAL_BUYER) {
            hospital = hospitalRepository.findByUserId(user.getId())
                    .orElseThrow(() -> new HospitalNotFoundException(
                            "Hospital details not found for this hospital buyer account"));
        }

        String token = jwtUtil.generateToken(user, hospital);

        return new AuthResponse(
                token,
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                hospital != null ? hospital.getId() : null,
                hospital != null ? hospital.getHospitalName() : null,
                hospital != null ? hospital.getRepresentativeFirstName() : null,
                hospital != null ? hospital.getRepresentativeLastName() : null
        );
    }

    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new InvalidCredentialsException("Missing or invalid Authorization header");
        }
        String token = authHeader.substring(7);
        Claims claims = jwtUtil.parseClaims(token);

        User user = userRepository.findByEmail(claims.getSubject())
                .orElseThrow(() -> new InvalidCredentialsException("User not found"));

        Hospital hospital = null;
        if (user.getRole() == Role.HOSPITAL_BUYER) {
            hospital = hospitalRepository.findByUserId(user.getId())
                    .orElseThrow(() -> new HospitalNotFoundException(
                            "Hospital details not found for this hospital buyer account"));
        }

        return toUserResponse(user, hospital);
    }

    @Transactional(readOnly = true)
    public HospitalResponse getHospitalByUserId(UUID userId) {
        Hospital hospital = hospitalRepository.findByUserId(userId)
                .orElseThrow(() -> new HospitalNotFoundException(
                        "Hospital details not found for user: " + userId));

        return new HospitalResponse(
                hospital.getId(),
                hospital.getUser().getId(),
                hospital.getHospitalName(),
                hospital.getRepresentativeFirstName(),
                hospital.getRepresentativeLastName(),
                hospital.getEmail(),
                hospital.getCreatedAt()
        );
    }

    private UserResponse toUserResponse(User user, Hospital hospital) {
        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                hospital != null ? hospital.getId() : null,
                hospital != null ? hospital.getHospitalName() : null,
                hospital != null ? hospital.getRepresentativeFirstName() : null,
                hospital != null ? hospital.getRepresentativeLastName() : null,
                user.getCreatedAt()
        );
    }
}