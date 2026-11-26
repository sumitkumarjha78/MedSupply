package com.medsupply.api_gateway.filter;

import com.medsupply.api_gateway.security.JwtUtil;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.util.Set;

@Component
public class JwtAuthAndRbacFilter implements GlobalFilter, Ordered {

    private final JwtUtil jwtUtil;

    public JwtAuthAndRbacFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    public int getOrder() {
        return -1;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getURI().getPath();
        HttpMethod method = request.getMethod();

        // 1. Allow preflight OPTIONS and public /api/auth/** endpoints (excluding /api/auth/admin/**)
        if (method == HttpMethod.OPTIONS
                || (path.startsWith("/api/auth/") && !path.startsWith("/api/auth/admin"))) {
            return chain.filter(exchange);
        }

        // 1. Allow preflight OPTIONS, public /api/auth/** (excluding /api/auth/admin/**),
//    and HMAC-authenticated CoinDrop server-to-server routes (/api/payments/coindrop/**)
        if (method == HttpMethod.OPTIONS
                || (path.startsWith("/api/auth/") && !path.startsWith("/api/auth/admin"))
                || path.startsWith("/api/payments/coindrop/")) {
            return chain.filter(exchange);
        }

        // 2. Block internal-only endpoints from external gateway access
        if (path.startsWith("/api/internal/")
                || (path.startsWith("/api/inventory/") && (path.endsWith("/deduct") || path.endsWith("/restore")))) {
            return writeError(exchange, HttpStatus.FORBIDDEN,
                    "Internal service endpoints are not accessible via API Gateway");
        }

        // 3. Require Bearer token on all protected routes
        String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return writeError(exchange, HttpStatus.UNAUTHORIZED, "Missing or invalid Authorization header");
        }

        String token = authHeader.substring(7);
        Claims claims;
        try {
            claims = jwtUtil.validateAndExtractClaims(token);
        } catch (JwtException | IllegalArgumentException ex) {
            return writeError(exchange, HttpStatus.UNAUTHORIZED, "Invalid or expired JWT token");
        }

        String role = claims.get("role", String.class);
        String email = claims.getSubject();
        Object rawUserId = claims.get("userId");
        String userId = rawUserId != null ? String.valueOf(rawUserId) : "";
        String hospitalId = claims.get("hospitalId", String.class);
        String hospitalName = claims.get("hospitalName", String.class);

        if (role == null || !isAuthorized(path, method, role)) {
            return writeError(exchange, HttpStatus.FORBIDDEN,
                    "Access denied for role " + role + " on " + method + " " + path);
        }

        // 4. Strip any client-spoofed identity headers and overwrite with verified JWT claims
        ServerHttpRequest mutatedRequest = request.mutate()
                .headers(headers -> {
                    headers.remove("X-User-Id");
                    headers.remove("X-User-Email");
                    headers.remove("X-User-Role");
                    headers.remove("X-Hospital-Id");
                    headers.remove("X-Hospital-Name");
                    headers.set("X-User-Id", userId);
                    headers.set("X-User-Email", email != null ? email : "");
                    headers.set("X-User-Role", role);
                    if (hospitalId != null) {
                        headers.set("X-Hospital-Id", hospitalId);
                    }
                    if (hospitalName != null) {
                        headers.set("X-Hospital-Name", hospitalName);
                    }
                })
                .build();

        return chain.filter(exchange.mutate().request(mutatedRequest).build());
    }

    private boolean isAuthorized(String path, HttpMethod method, String role) {
        // Admin staff management: ADMIN only
        if (path.startsWith("/api/auth/admin")) {
            return "ADMIN".equals(role);
        }

        // Products: GET -> all roles; POST/PUT/DELETE -> ADMIN only
        if (path.startsWith("/api/products")) {
            if (method == HttpMethod.GET) {
                return Set.of("ADMIN", "INVENTORY_MANAGER", "HOSPITAL_BUYER").contains(role);
            }
            return "ADMIN".equals(role);
        }

        // Inventory: GET -> all roles; POST/PUT -> ADMIN or INVENTORY_MANAGER
        if (path.startsWith("/api/inventory")) {
            if (method == HttpMethod.GET) {
                return Set.of("ADMIN", "INVENTORY_MANAGER", "HOSPITAL_BUYER").contains(role);
            }
            if (method == HttpMethod.POST || method == HttpMethod.PUT) {
                return Set.of("ADMIN", "INVENTORY_MANAGER").contains(role);
            }
            return false;
        }

        // Orders: POST/GET/PATCH -> HOSPITAL_BUYER or ADMIN
        if (path.startsWith("/api/orders")) {
            return Set.of("HOSPITAL_BUYER", "ADMIN").contains(role);
        }

        return false;
    }

    private Mono<Void> writeError(ServerWebExchange exchange, HttpStatus status, String message) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(status);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);
        String safeMessage = message.replace("\"", "'");
        String json = String.format("{\"status\":%d,\"error\":\"%s\"}", status.value(), safeMessage);
        DataBuffer buffer = response.bufferFactory().wrap(json.getBytes(StandardCharsets.UTF_8));
        return response.writeWith(Mono.just(buffer));
    }
}