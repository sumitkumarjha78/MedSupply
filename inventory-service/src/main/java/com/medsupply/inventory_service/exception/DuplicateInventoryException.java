
package com.medsupply.inventory_service.exception;

public class DuplicateInventoryException extends RuntimeException {

    public DuplicateInventoryException(String message) {
        super(message);
    }
}
