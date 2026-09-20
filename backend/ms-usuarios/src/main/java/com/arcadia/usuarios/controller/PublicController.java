package com.arcadia.usuarios.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Endpoints requeridos por las guías de la asignatura:
 * - GET /public/hola (público sin autenticación)
 * - GET /api/me (privado, requiere Bearer Access Token con audiencia api://{client-id})
 */
@RestController
public class PublicController {

    @GetMapping("/public/hola")
    public ResponseEntity<Map<String, Object>> hola() {
        Map<String, Object> resp = new HashMap<>();
        resp.put("mensaje", "Hola desde la API de Arcadia en AWS EC2");
        resp.put("timestamp", Instant.now().toString());
        resp.put("servicio", "Arcadia Backend (ms-usuarios)");
        resp.put("estado", "OK");
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/api/me")
    public ResponseEntity<Map<String, Object>> apiMe(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(Map.of("error", "No autenticado"));
        }
        Map<String, Object> resp = new HashMap<>();
        resp.put("preferred_username", authentication.getName());
        resp.put("usuario", authentication.getName());
        resp.put("authorities", authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList()));
        resp.put("mensaje", "Autenticado con éxito en Arcadia via Access Token");
        return ResponseEntity.ok(resp);
    }
}
