package com.arcadia.usuarios.service;

import com.arcadia.usuarios.model.Usuario;
import com.arcadia.usuarios.repository.UsuarioRepository;
import com.arcadia.usuarios.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class UsuarioServiceImpl implements UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder   passwordEncoder;
    private final JwtUtils          jwtUtils;

    @Override
    @Transactional(readOnly = true)
    public List<Usuario> obtenerTodos() {
        return usuarioRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Usuario> obtenerPorId(String id) {
        return usuarioRepository.findById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Usuario> obtenerPorEmail(String email) {
        return usuarioRepository.findByEmail(email);
    }

    @Override
    public Usuario registrar(Usuario usuario) {
        log.info("Registrando usuario: {}", usuario.getEmail());

        boolean emailExists = usuarioRepository.existsByEmail(usuario.getEmail());
        log.info("Verificando si email existe: {} = {}", usuario.getEmail(), emailExists);

        if (emailExists) {
            throw new RuntimeException("El email ya está registrado: " + usuario.getEmail());
        }

        // Hashear la contraseña antes de guardar
        log.info("Hasheando contraseña para usuario: {}", usuario.getEmail());
        usuario.setPassword(passwordEncoder.encode(usuario.getPassword()));
        log.info("Contraseña hasheada para usuario: {}", usuario.getEmail());

        log.info("Guardando usuario en base de datos: {}", usuario.getEmail());
        Usuario saved = usuarioRepository.save(usuario);
        log.info("Usuario guardado exitosamente: {}", saved.getEmail());

        return saved;
    }

    @Override
    public Usuario actualizar(String id, Usuario usuarioActualizado) {
        return usuarioRepository.findById(id)
                .map(existente -> {
                    existente.setNombre(usuarioActualizado.getNombre());
                    existente.setRol(usuarioActualizado.getRol());
                    existente.setFotoPerfilUri(usuarioActualizado.getFotoPerfilUri());

                    // Solo re-hashear si se envió una nueva contraseña
                    if (usuarioActualizado.getPassword() != null &&
                            !usuarioActualizado.getPassword().isBlank()) {
                        existente.setPassword(
                                passwordEncoder.encode(usuarioActualizado.getPassword()));
                    }

                    return usuarioRepository.save(existente);
                })
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado: " + id));
    }

    @Override
    public void eliminar(String id) {
        if (!usuarioRepository.existsById(id)) {
            throw new RuntimeException("Usuario no encontrado: " + id);
        }
        usuarioRepository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existeEmail(String email) {
        return usuarioRepository.existsByEmail(email);
    }

    /**
     * Verifica credenciales con BCrypt y devuelve un Map con el token JWT
     * y los datos básicos del usuario, o empty si las credenciales son inválidas.
     */
    @Override
    @Transactional(readOnly = true)
    public Optional<Map<String, Object>> login(String email, String password) {
        log.info("Intento de login: {}", email);

        return usuarioRepository.findByEmail(email)
                .filter(u -> passwordEncoder.matches(password, u.getPassword()))
                .map(u -> {
                    String token = jwtUtils.generarToken(u.getEmail(), u.getRol(), u.getId());
                    return Map.<String, Object>of(
                            "token",  token,
                            "tipo",   "Bearer",
                            "userId", u.getId(),
                            "nombre", u.getNombre(),
                            "email",  u.getEmail(),
                            "rol",    u.getRol()
                    );
                });
    }
}
