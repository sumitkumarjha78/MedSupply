
package com.medsupply.order_service.client;

import com.medsupply.order_service.client.dto.InventoryResponse;
import com.medsupply.order_service.exception.ExternalServiceException;
import com.medsupply.order_service.exception.InsufficientStockException;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.util.Map;
import java.util.UUID;

@Component
public class InventoryClient {

    private final RestClient inventoryRestClient;

    public InventoryClient(
            @Qualifier("inventoryRestClient") RestClient inventoryRestClient) {
        this.inventoryRestClient = inventoryRestClient;
    }

    public InventoryResponse getInventoryByProductId(UUID productId) {
        try {
            InventoryResponse inventory = inventoryRestClient.get()
                    .uri("/api/inventory/{productId}", productId)
                    .retrieve()
                    .body(InventoryResponse.class);

            if (inventory == null) {
                throw new ExternalServiceException(
                        "Inventory Service returned an empty response");
            }

            return inventory;

        } catch (RestClientResponseException ex) {
            if (ex.getStatusCode().value() == 404) {
                throw new InsufficientStockException(
                        "No inventory record exists for product: " + productId);
            }

            throw new ExternalServiceException(
                    "Inventory Service returned HTTP "
                            + ex.getStatusCode().value(), ex);

        } catch (RestClientException ex) {
            throw new ExternalServiceException(
                    "Inventory Service is unavailable", ex);
        }
    }

    public void deductStock(UUID productId, Integer quantity) {
        try {
            inventoryRestClient.post()
                    .uri("/api/inventory/{productId}/deduct", productId)
                    .body(Map.of("quantity", quantity))
                    .retrieve()
                    .toBodilessEntity();

        } catch (RestClientResponseException ex) {
            if (ex.getStatusCode().value() == 400
                    || ex.getStatusCode().value() == 409) {
                throw new InsufficientStockException(
                        "Insufficient stock for product: " + productId);
            }

            throw new ExternalServiceException(
                    "Inventory Service returned HTTP "
                            + ex.getStatusCode().value(), ex);

        } catch (RestClientException ex) {
            throw new ExternalServiceException(
                    "Unable to deduct stock for product: " + productId, ex);
        }
    }

    public void restoreStock(UUID productId, Integer quantity) {
        try {
            inventoryRestClient.post()
                    .uri("/api/inventory/{productId}/restore", productId)
                    .body(Map.of("quantity", quantity))
                    .retrieve()
                    .toBodilessEntity();

        } catch (RestClientException ex) {
            throw new ExternalServiceException(
                    "Unable to restore stock for product: " + productId, ex);
        }
    }
}
