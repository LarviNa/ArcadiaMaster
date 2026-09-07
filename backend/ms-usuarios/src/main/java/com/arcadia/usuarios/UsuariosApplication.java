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
}
