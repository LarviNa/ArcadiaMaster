package com.arcadiacomics.ventas.dto;

import java.io.Serializable;

/**
 * DTO que representa un ítem o ejemplar de cómic adquirido en una venta.
 * Utilizado por los consumidores de boletas PDF y de actualización de stock.
 */
public class VentaItemDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    private String comicId;
    private String titulo;
    private Double precio;
    private Integer cantidad;
    private Double subtotal;
    private String imagenUrl;

    public VentaItemDTO() {
    }

    public VentaItemDTO(String comicId, String titulo, Double precio, Integer cantidad, String imagenUrl) {
        this.comicId = comicId;
        this.titulo = titulo;
        this.precio = precio != null ? precio : 0.0;
        this.cantidad = cantidad != null ? cantidad : 1;
        this.subtotal = this.precio * this.cantidad;
        this.imagenUrl = imagenUrl;
    }

    public String getComicId() {
        return comicId;
    }

    public void setComicId(String comicId) {
        this.comicId = comicId;
    }

    public String getTitulo() {
        return titulo != null ? titulo : "Cómic " + comicId;
    }

    public void setTitulo(String titulo) {
        this.titulo = titulo;
    }

    public String getTitle() {
        return getTitulo();
    }

    public void setTitle(String title) {
        this.titulo = title;
    }

    public Double getPrecio() {
        return precio != null ? precio : 0.0;
    }

    public void setPrecio(Double precio) {
        this.precio = precio;
        if (this.cantidad != null) {
            this.subtotal = this.precio * this.cantidad;
        }
    }

    public Double getPrice() {
        return getPrecio();
    }

    public void setPrice(Double price) {
        setPrecio(price);
    }

    public Integer getCantidad() {
        return cantidad != null ? cantidad : 1;
    }

    public void setCantidad(Integer cantidad) {
        this.cantidad = cantidad;
        if (this.precio != null) {
            this.subtotal = this.precio * this.cantidad;
        }
    }

    public Integer getQuantity() {
        return getCantidad();
    }

    public void setQuantity(Integer quantity) {
        setCantidad(quantity);
    }

    public Double getSubtotal() {
        if (subtotal == null) {
            return getPrecio() * getCantidad();
        }
        return subtotal;
    }

    public void setSubtotal(Double subtotal) {
        this.subtotal = subtotal;
    }

    public String getImagenUrl() {
        return imagenUrl;
    }

    public void setImagenUrl(String imagenUrl) {
        this.imagenUrl = imagenUrl;
    }

    public String getCoverImage() {
        return getImagenUrl();
    }

    public void setCoverImage(String coverImage) {
        this.imagenUrl = coverImage;
    }

    @Override
    public String toString() {
        return "VentaItemDTO{" +
                "comicId='" + comicId + '\'' +
                ", titulo='" + titulo + '\'' +
                ", precio=" + precio +
                ", cantidad=" + cantidad +
                ", subtotal=" + subtotal +
                '}';
    }
}
