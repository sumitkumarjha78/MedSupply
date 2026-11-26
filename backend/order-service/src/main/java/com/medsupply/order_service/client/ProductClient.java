
package com.medsupply.order_service.client;

import com.medsupply.order_service.client.dto.ProductResponse;
import com.medsupply.order_service.exception.ExternalServiceException;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.util.UUID;

@Component
public class ProductClient {

    private final RestClient productRestClient;

    public ProductClient(
            @Qualifier("productRestClient") RestClient productRestClient) {
        this.productRestClient = productRestClient;
    }

    public ProductResponse getProductById(UUID productId) {
        try {
            ProductResponse product = productRestClient.get()
                    .uri("/api/products/{id}", productId)
                    .retrieve()
                    .body(ProductResponse.class);

            if (product == null || product.id() == null) {
                throw new ExternalServiceException(
                        "Product Service returned an invalid response");
            }

            return product;

        } catch (RestClientResponseException ex) {
            if (ex.getStatusCode().value() == 404) {
                throw new IllegalArgumentException(
                        "Product not found: " + productId);
            }

            throw new ExternalServiceException(
                    "Product Service returned HTTP "
                            + ex.getStatusCode().value(), ex);

        } catch (RestClientException ex) {
            throw new ExternalServiceException(
                    "Product Service is unavailable", ex);
        }
    }
}
