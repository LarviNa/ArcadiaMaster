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
import org.springframework.stereotype.Component;

import java.net.URL;
import java.util.Date;
import java.util.List;

@Component
@Slf4j
public class AzureTokenValidator {

    private static final String AZURE_JWKS_URL = "https://login.microsoftonline.com/common/discovery/v2.0/keys";
    private final ConfigurableJWTProcessor<SecurityContext> jwtProcessor;

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
        this.jwtProcessor = new DefaultJWTProcessor<>();
        try {
            URL jwkSetURL = new URL(AZURE_JWKS_URL);
            JWKSource<SecurityContext> keySource = new RemoteJWKSet<>(jwkSetURL);
            JWSKeySelector<SecurityContext> keySelector =
                    new JWSVerificationKeySelector<>(JWSAlgorithm.RS256, keySource);
            this.jwtProcessor.setJWSKeySelector(keySelector);
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

            // Determinar rol
            String rol = "Cliente";
            List<String> roles = claims.getStringListClaim("roles");
            if (roles != null) {
                boolean isAdmin = roles.stream().anyMatch(r -> r.equalsIgnoreCase("Admin") || r.equalsIgnoreCase("Administrador"));
                if (isAdmin) {
                    rol = "Admin";
                }
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
