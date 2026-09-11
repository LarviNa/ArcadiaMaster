package com.arcadia.usuarios.security;

import com.arcadia.usuarios.model.Usuario;
import com.arcadia.usuarios.repository.UsuarioRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtils jwtUtils;
    private final AzureTokenValidator azureTokenValidator;
    private final UserDetailsService userDetailsService;
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String token = extraerToken(request);

        if (token != null) {
            if (jwtUtils.validarToken(token)) {
                // Token JWT local de Arcadia — flujo normal
                String email = jwtUtils.getEmailDesdeToken(token);
                autenticarUsuario(email, request);
            } else if (azureTokenValidator.esTokenAzure(token)) {
                // Token de Microsoft Entra ID (Azure AD) — validar y provisionar
                var claims = azureTokenValidator.validarToken(token);
                if (claims != null) {
                    var info = azureTokenValidator.extraerInformacion(claims);
                    if (info != null && info.getEmail() != null) {
                        aprovisionarSiNecesario(info);
                        autenticarUsuario(info.getEmail(), request);
                    }
                }
            }
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Crea el usuario en la BD si aún no existe (primera vez que se autentica con Microsoft).
     */
    @Transactional
    protected void aprovisionarSiNecesario(AzureTokenValidator.AzureUserInfo info) {
        if (!usuarioRepository.existsByEmail(info.getEmail())) {
            log.info("Aprovisionando usuario Azure en BD: {}", info.getEmail());
            Usuario nuevo = new Usuario();
            nuevo.setEmail(info.getEmail());
            nuevo.setNombre(info.getNombre());
            // Contraseña aleatoria — la autenticación real es delegada a Microsoft
            nuevo.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
            nuevo.setRol(info.getRol());
            nuevo.setProveedor("MICROSOFT");
            nuevo.setEsMicrosoft(true);
            usuarioRepository.save(nuevo);
        } else {
            usuarioRepository.findByEmail(info.getEmail()).ifPresent(existente -> {
                boolean modificado = false;
                if (!"MICROSOFT".equalsIgnoreCase(existente.getProveedor()) || !Boolean.TRUE.equals(existente.getEsMicrosoft())) {
                    existente.setProveedor("MICROSOFT");
                    existente.setEsMicrosoft(true);
                    modificado = true;
                }
                if ("Admin".equalsIgnoreCase(info.getRol()) && !"Admin".equalsIgnoreCase(existente.getRol())) {
                    existente.setRol("Admin");
                    modificado = true;
                }
                if (modificado) {
                    usuarioRepository.save(existente);
                }
            });
        }
    }

    private void autenticarUsuario(String email, HttpServletRequest request) {
        try {
            UserDetails userDetails = userDetailsService.loadUserByUsername(email);
            UsernamePasswordAuthenticationToken auth =
                    new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities());
            auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(auth);
        } catch (Exception e) {
            log.warn("No se pudo cargar el usuario para autenticación: {}", email);
        }
    }

    /** Extrae el token del header Authorization: Bearer <token> */
    private String extraerToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (StringUtils.hasText(header) && header.startsWith("Bearer ")) {
            return header.substring(7);
        }
        return null;
    }
}
