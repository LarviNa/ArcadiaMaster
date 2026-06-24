package com.arcadia.usuarios.service;

import com.arcadia.usuarios.model.Usuario;

import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface UsuarioService {
    List<Usuario> obtenerTodos();
    Optional<Usuario> obtenerPorId(String id);
    Optional<Usuario> obtenerPorEmail(String email);
    Usuario registrar(Usuario usuario);
    Usuario actualizar(String id, Usuario usuario);
    void eliminar(String id);
    boolean existeEmail(String email);

    // Devuelve token JWT + datos del usuario, o empty si las credenciales son inválidas
    Optional<Map<String, Object>> login(String email, String password);
}
