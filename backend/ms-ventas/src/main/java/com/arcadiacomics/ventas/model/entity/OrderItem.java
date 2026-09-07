package com.arcadiacomics.ventas.model.entity;

import jakarta.persistence.Embeddable;

@Embeddable
public class OrderItem {

    private String comicId;
    private Integer quantity;

    public OrderItem() {
    }

    public OrderItem(String comicId, Integer quantity) {
        this.comicId = comicId;
        this.quantity = quantity;
    }

    public String getComicId() {
        return comicId;
    }

    public void setComicId(String comicId) {
        this.comicId = comicId;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }
}
