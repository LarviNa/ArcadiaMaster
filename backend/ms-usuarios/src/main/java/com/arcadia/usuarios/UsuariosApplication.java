package com.arcadia.usuarios;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class UsuariosApplication {

    public static void main(String[] args) {
        SpringApplication.run(UsuariosApplication.class, args);
        System.out.println("\n========================================");
        System.out.println("👤 Microservicio Usuarios INICIADO");
        System.out.println("📍 Puerto: 8085");
        System.out.println("🌐 URL: http://localhost:8085/api/usuarios");
        System.out.println("❤️  Health: http://localhost:8085/api/usuarios/health");
        System.out.println("========================================\n");
    }

    @org.springframework.context.annotation.Bean
    org.springframework.boot.CommandLineRunner initDatabase(
            com.arcadia.usuarios.repository.UsuarioRepository usuarioRepository,
            org.springframework.security.crypto.password.PasswordEncoder passwordEncoder) {
        return args -> {
            if (usuarioRepository.count() == 0) {
                // 1. Administrador Local
                com.arcadia.usuarios.model.Usuario admin = new com.arcadia.usuarios.model.Usuario();
                admin.setNombre("Administrador Arcadia");
                admin.setEmail("admin@arcadiacomics.cl");
                admin.setPassword(passwordEncoder.encode("Admin123!"));
                admin.setRol("Admin");
                admin.setProveedor("LOCAL");
                admin.setEsMicrosoft(false);
                admin.setFechaRegistro(java.time.LocalDateTime.now().minusDays(10));
                usuarioRepository.save(admin);

                // 2. Administrador Microsoft Entra ID
                com.arcadia.usuarios.model.Usuario msUser = new com.arcadia.usuarios.model.Usuario();
                msUser.setNombre("Matias Barraza Contreras");
                msUser.setEmail("mat.barrazac@duocuc.cl");
                msUser.setPassword(passwordEncoder.encode("Matias123!"));
                msUser.setRol("Admin");
                msUser.setProveedor("MICROSOFT");
                msUser.setEsMicrosoft(true);
                msUser.setFechaRegistro(java.time.LocalDateTime.now().minusDays(5));
                usuarioRepository.save(msUser);

                // 3. Cliente Local
                com.arcadia.usuarios.model.Usuario cliente = new com.arcadia.usuarios.model.Usuario();
                cliente.setNombre("Cliente Arcadia");
                cliente.setEmail("cliente@arcadiacomics.cl");
                cliente.setPassword(passwordEncoder.encode("Cliente123!"));
                cliente.setRol("Cliente");
                cliente.setProveedor("LOCAL");
                cliente.setEsMicrosoft(false);
                cliente.setFechaRegistro(java.time.LocalDateTime.now().minusDays(2));
                usuarioRepository.save(cliente);

                System.out.println("✅ [SEED] Usuarios iniciales creados en MySQL (1 Microsoft, 2 Locales)");
            }
        };
    }
}
