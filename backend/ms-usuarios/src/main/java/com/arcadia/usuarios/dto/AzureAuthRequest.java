package com.arcadia.usuarios.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AzureAuthRequest {

    @NotBlank(message = "El token de Azure es obligatorio")
    private String idToken;
}
