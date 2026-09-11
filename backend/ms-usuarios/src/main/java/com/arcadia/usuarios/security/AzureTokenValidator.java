package com.arcadia.usuarios.security;

import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.jwk.source.RemoteJWKSet;
import com.nimbusds.jose.proc.JWSKeySelector;
import com.nimbusds.jose.proc.JWSVerificationKeySelector;
import com.nimbusds.jose.proc.SecurityContext;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import com.nimbusds.jwt.proc.ConfigurableJWTProcessor;
import com.nimbusds.jwt.proc.DefaultJWTProcessor;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URL;
import java.util.Arrays;
import java.util.Date;
import java.util.List;

@Component
@Slf4j
public class AzureTokenValidator {

    @Value("${azure.tenant-id:common}")
    private String tenantId;

    @Value("${azure.admin-emails:}")
    private String adminEmailsConfig;

    @Value("${azure.admin-groups:}")
    private String adminGroupsConfig;

    private ConfigurableJWTProcessor<SecurityContext> jwtProcessor;

    @Getter
    public static class AzureUserInfo {
        private final String email;
        private final String nombre;
        private final String rol;
        private final String azureId;

        public AzureUserInfo(String email, String nombre, String rol, String azureId) {
            this.email = email;
            this.nombre = nombre;
            this.rol = rol;
            this.azureId = azureId;
        }
    }

    public AzureTokenValidator() {
        // Inicialización por defecto en caso de no usar Spring injection directa
        initProcessor("common");
    }

    @PostConstruct
    public void init() {
        String effectiveTenant = (tenantId != null && !tenantId.isBlank()) ? tenantId : "common";
        initProcessor(effectiveTenant);
    }

    private void initProcessor(String tenant) {
        this.jwtProcessor = new DefaultJWTProcessor<>();
        try {
            String jwksUrl = String.format("https://login.microsoftonline.com/%s/discovery/v2.0/keys", tenant);
            URL jwkSetURL = new URL(jwksUrl);
            JWKSource<SecurityContext> keySource = new RemoteJWKSet<>(jwkSetURL);
            JWSKeySelector<SecurityContext> keySelector =
                    new JWSVerificationKeySelector<>(JWSAlgorithm.RS256, keySource);
            this.jwtProcessor.setJWSKeySelector(keySelector);
            log.info("AzureTokenValidator configurado exitosamente con JWKS: {}", jwksUrl);
        } catch (Exception e) {
            log.error("Error al configurar el conjunto de claves JWKS de Azure Entra ID", e);
        }
    }

    /**
     * Verifica rápidamente si un token parece provenir de Azure/Microsoft sin validar aún la firma.
     */
    public boolean esTokenAzure(String token) {
        try {
            SignedJWT signedJWT = SignedJWT.parse(token);
            String issuer = signedJWT.getJWTClaimsSet().getIssuer();
            return issuer != null && (
                    issuer.contains("login.microsoftonline.com") ||
                    issuer.contains("sts.windows.net") ||
                    issuer.contains("microsoft")
            );
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Valida la firma criptográfica RSA y la vigencia del token contra las llaves públicas de Microsoft.
     */
    public JWTClaimsSet validarToken(String token) {
        try {
            JWTClaimsSet claimsSet = jwtProcessor.process(token, null);
            Date expiration = claimsSet.getExpirationTime();
            if (expiration != null && expiration.before(new Date())) {
                log.warn("Token de Azure expirado");
                return null;
            }
            return claimsSet;
        } catch (Exception e) {
            log.warn("Fallo al validar token de Azure: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Extrae información de perfil básica desde las claims de Azure Entra ID.
     */
    public AzureUserInfo extraerInformacion(JWTClaimsSet claims) {
        if (claims == null) return null;

        try {
            // Microsoft puede proveer el email en preferred_username, email o upn
            String email = claims.getStringClaim("preferred_username");
            if (email == null || email.isBlank()) {
                email = claims.getStringClaim("email");
            }
            if (email == null || email.isBlank()) {
                email = claims.getStringClaim("upn");
            }
            if (email == null || email.isBlank()) {
                email = claims.getSubject();
            }

            String nombre = claims.getStringClaim("name");
            if (nombre == null || nombre.isBlank()) {
                nombre = email;
            }

            // Determinar rol con verificación multinivel
            String rol = "Cliente";
            boolean esAdminPorClaim = false;
            boolean esAdminPorEmail = false;
            boolean esAdminPorGrupo = false;

            // 1. Verificación por claim 'roles' de Microsoft Entra ID (App Roles)
            List<String> roles = claims.getStringListClaim("roles");
            if (roles != null) {
                esAdminPorClaim = roles.stream().anyMatch(r ->
                        r.equalsIgnoreCase("Admin") ||
                        r.equalsIgnoreCase("Administrador") ||
                        r.equalsIgnoreCase("GlobalAdmin")
                );
            }

            // 2. Verificación por lista de correos administradores configurada (azure.admin-emails)
            if (email != null && adminEmailsConfig != null && !adminEmailsConfig.isBlank()) {
                final String userEmail = email.trim().toLowerCase();
                esAdminPorEmail = Arrays.stream(adminEmailsConfig.split(","))
                        .map(String::trim)
                        .map(String::toLowerCase)
                        .filter(s -> !s.isEmpty())
                        .anyMatch(userEmail::equals);
            }

            // 3. Verificación por grupos de seguridad de Microsoft (groups claim)
            List<String> groups = claims.getStringListClaim("groups");
            if (groups != null && adminGroupsConfig != null && !adminGroupsConfig.isBlank()) {
                List<String> targetGroups = Arrays.stream(adminGroupsConfig.split(","))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .toList();
                esAdminPorGrupo = groups.stream().anyMatch(targetGroups::contains);
            }

            if (esAdminPorClaim || esAdminPorEmail || esAdminPorGrupo) {
                rol = "Admin";
                log.info("Rol 'Admin' concedido para {}: [claim={}, email={}, grupo={}]",
                        email, esAdminPorClaim, esAdminPorEmail, esAdminPorGrupo);
            } else {
                log.debug("Rol asignado por defecto 'Cliente' para {}", email);
            }

            String azureId = claims.getStringClaim("oid");
            if (azureId == null) {
                azureId = claims.getSubject();
            }

            return new AzureUserInfo(email, nombre, rol, azureId);
        } catch (Exception e) {
            log.error("Error al extraer información del token de Azure: {}", e.getMessage());
            return null;
        }
    }
}
