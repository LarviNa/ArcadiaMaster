package com.arcadiacomics.ventas.model.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

@Embeddable
public class OrderItem {

    private String comicId;
    private Integer quantity;

    @Column(name = "item_title")
    private String title;

    @Column(name = "item_price")
    private Double price;

    @Column(name = "item_cover_image")
    private String coverImage;

    public OrderItem() {
    }

    public OrderItem(String comicId, Integer quantity) {
        this.comicId = comicId;
        this.quantity = quantity;
    }

    public OrderItem(String comicId, Integer quantity, String title, Double price, String coverImage) {
        this.comicId = comicId;
        this.quantity = quantity;
        this.title = title;
        this.price = price;
        this.coverImage = coverImage;
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

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public Double getPrice() {
        return price;
    }

    public void setPrice(Double price) {
        this.price = price;
    }

    public String getCoverImage() {
        return coverImage;
    }

    public void setCoverImage(String coverImage) {
        this.coverImage = coverImage;
    }
}
