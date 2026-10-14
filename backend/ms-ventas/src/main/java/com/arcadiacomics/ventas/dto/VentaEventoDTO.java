package com.arcadiacomics.ventas.dto;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/**
 * DTO principal del Evento de Venta en Arcadia Cómics.
 * Publicado al Direct Exchange 'comics.ventas.direct' con la routing key 'venta.confirmada'.
 * Consumido por 'cola.ventas.pdf' (emisión de comprobante y despacho) y 'cola.ventas.stock' (descuento de inventario).
 */
public class VentaEventoDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    private String idVenta;
    private String clienteId;
    private String clienteNombre;
    private String clienteEmail;
    private List<VentaItemDTO> items = new ArrayList<>();
    private String fechaVenta;
    private Double total;
    private String estado;

    public VentaEventoDTO() {
        this.fechaVenta = LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        this.estado = "CONFIRMADA";
    }

    public VentaEventoDTO(String idVenta, String clienteId, String clienteNombre, String clienteEmail,
                          List<VentaItemDTO> items, Double total) {
        this.idVenta = idVenta;
        this.clienteId = clienteId;
        this.clienteNombre = clienteNombre;
        this.clienteEmail = clienteEmail;
        this.items = items != null ? items : new ArrayList<>();
        this.fechaVenta = LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        this.total = total;
        this.estado = "CONFIRMADA";
    }

    public String getIdVenta() {
        return idVenta;
    }

    public void setIdVenta(String idVenta) {
        this.idVenta = idVenta;
    }

    public String getOrderId() {
        return getIdVenta();
    }

    public void setOrderId(String orderId) {
        setIdVenta(orderId);
    }

    public String getClienteId() {
        return clienteId;
    }

    public void setClienteId(String clienteId) {
        this.clienteId = clienteId;
    }

    public String getUserId() {
        return getClienteId();
    }

    public void setUserId(String userId) {
        setClienteId(userId);
    }

    public String getClienteNombre() {
        return clienteNombre != null ? clienteNombre : "Cliente Arcadia";
    }

    public void setClienteNombre(String clienteNombre) {
        this.clienteNombre = clienteNombre;
    }

    public String getCustomerName() {
        return getClienteNombre();
    }

    public void setCustomerName(String customerName) {
        setClienteNombre(customerName);
    }

    public String getClienteEmail() {
        return clienteEmail != null ? clienteEmail : "cliente@arcadiacomics.cl";
    }

    public void setClienteEmail(String clienteEmail) {
        this.clienteEmail = clienteEmail;
    }

    public String getCustomerEmail() {
        return getClienteEmail();
    }

    public void setCustomerEmail(String customerEmail) {
        setClienteEmail(customerEmail);
    }

    public List<VentaItemDTO> getItems() {
        return items;
    }

    public void setItems(List<VentaItemDTO> items) {
        this.items = items != null ? items : new ArrayList<>();
    }

    public String getFechaVenta() {
        return fechaVenta;
    }

    public void setFechaVenta(String fechaVenta) {
        this.fechaVenta = fechaVenta;
    }

    public Double getTotal() {
        return total != null ? total : 0.0;
    }

    public void setTotal(Double total) {
        this.total = total;
    }

    public Double getTotalAmount() {
        return getTotal();
    }

    public void setTotalAmount(Double totalAmount) {
        setTotal(totalAmount);
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    @Override
    public String toString() {
        return "VentaEventoDTO{" +
                "idVenta='" + idVenta + '\'' +
                ", clienteNombre='" + clienteNombre + '\'' +
                ", clienteEmail='" + clienteEmail + '\'' +
                ", itemsCount=" + (items != null ? items.size() : 0) +
                ", total=" + total +
                ", fechaVenta='" + fechaVenta + '\'' +
                '}';
    }
}
