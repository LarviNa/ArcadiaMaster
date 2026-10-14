package com.arcadiacomics.ventas.dto;

import java.util.ArrayList;
import java.util.List;

/**
 * DTO legado de eventos de orden.
 * Extiende de VentaEventoDTO para máxima retrocompatibilidad.
 */
public class OrderEventDTO extends VentaEventoDTO {

    private List<OrderItemDTO> legacyItems;

    public OrderEventDTO() {
        super();
    }

    public OrderEventDTO(String orderId, String userId, List<OrderItemDTO> items) {
        super(orderId, userId, null, null, null, 0.0);
        this.legacyItems = items;
        if (items != null) {
            List<VentaItemDTO> converted = new ArrayList<>();
            for (OrderItemDTO it : items) {
                converted.add(new VentaItemDTO(
                        it.getComicId(),
                        it.getTitle(),
                        it.getPrice(),
                        it.getQuantity(),
                        it.getCoverImage()
                ));
            }
            this.setItems(converted);
        }
    }

    public List<OrderItemDTO> getLegacyItems() {
        return legacyItems;
    }

    public void setLegacyItems(List<OrderItemDTO> legacyItems) {
        this.legacyItems = legacyItems;
    }
}
