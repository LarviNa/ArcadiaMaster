package com.arcadia.usuarios.repository;

import com.arcadia.usuarios.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, String> {

    Optional<Usuario> findByEmail(String email);
    boolean existsByEmail(String email);

    // findByEmailAndPassword eliminado — el login ahora usa BCrypt via PasswordEncoder
}
