
package com.medsupply.order_service.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
public class RestClientConfig {

    @Bean
    public RestClient productRestClient(
            RestClient.Builder builder,
            @Value("${product-service.base-url}") String baseUrl) {

        return builder.clone()
                .baseUrl(baseUrl)
                .build();
    }

    @Bean
    public RestClient inventoryRestClient(
            RestClient.Builder builder,
            @Value("${inventory-service.base-url}") String baseUrl) {

        return builder.clone()
                .baseUrl(baseUrl)
                .build();
    }
    @Bean
    public RestClient authRestClient(
            RestClient.Builder builder,
            @Value("${auth-service.base-url}") String baseUrl) {

        return builder.clone()
                .baseUrl(baseUrl)
                .build();
    }

    @Bean
    public RestClient coindropRestClient(
            RestClient.Builder builder,
            CoinDropProperties coinDropProperties) {

        return builder.clone()
                .baseUrl(coinDropProperties.getBaseUrl())
                .build();
    }
}
