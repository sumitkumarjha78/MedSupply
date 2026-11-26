package com.medsupply.order_service.client;


import com.medsupply.order_service.dto.response.HospitalResponse;
import com.medsupply.order_service.exception.ExternalServiceException;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.util.UUID;

@Component
public class HospitalClient {

    private final RestClient authRestClient;

    public HospitalClient(@Qualifier("authRestClient") RestClient authRestClient) {
        this.authRestClient = authRestClient;
    }

    public HospitalResponse getHospitalByUserId(UUID userId) {
        try {
            HospitalResponse hospital = authRestClient.get()
                    .uri("/api/internal/hospitals/by-user/{userId}", userId)
                    .retrieve()
                    .body(HospitalResponse.class);

            if (hospital == null || hospital.id() == null) {
                throw new ExternalServiceException("Auth Service returned an invalid hospital response");
            }

            return hospital;

        } catch (RestClientResponseException ex) {
            if (ex.getStatusCode().value() == 404) {
                throw new IllegalArgumentException(
                        "No registered hospital details found for buyer: " + userId);
            }
            throw new ExternalServiceException(
                    "Auth Service returned HTTP " + ex.getStatusCode().value(), ex);

        } catch (RestClientException ex) {
            throw new ExternalServiceException("Auth Service is unavailable", ex);
        }
    }
}