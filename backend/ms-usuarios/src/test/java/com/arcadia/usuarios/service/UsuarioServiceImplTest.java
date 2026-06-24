package com.arcadia.usuarios.service;

import com.arcadia.usuarios.model.Usuario;
import com.arcadia.usuarios.repository.UsuarioRepository;
import com.arcadia.usuarios.security.JwtUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Tests para UsuarioServiceImpl")
class UsuarioServiceImplTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtils jwtUtils;

    @InjectMocks
    private UsuarioServiceImpl usuarioService;

    private Usuario usuarioTest;

    @BeforeEach
    void setUp() {
        usuarioTest = new Usuario(
                "1",
                "Juan Pérez",
                "juan@test.com",
                "$2a$10$hasheado",   // simula hash BCrypt
                "Cliente"
        );
    }

    // ── obtenerTodos ──────────────────────────────────────

    @Test
    @DisplayName("Debe obtener todos los usuarios")
    void debeObtenerTodosLosUsuarios() {
        List<Usuario> usuarios = Arrays.asList(
                usuarioTest,
                new Usuario("2", "María López", "maria@test.com", "$2a$10$otroHash", "Cliente")
        );
        when(usuarioRepository.findAll()).thenReturn(usuarios);

        List<Usuario> resultado = usuarioService.obtenerTodos();

        assertNotNull(resultado);
        assertEquals(2, resultado.size());
        assertEquals("Juan Pérez", resultado.get(0).getNombre());
        verify(usuarioRepository, times(1)).findAll();
    }

    // ── obtenerPorId ──────────────────────────────────────

    @Test
    @DisplayName("Debe obtener usuario por ID cuando existe")
    void debeObtenerUsuarioPorIdCuandoExiste() {
        when(usuarioRepository.findById("1")).thenReturn(Optional.of(usuarioTest));

        Optional<Usuario> resultado = usuarioService.obtenerPorId("1");

        assertTrue(resultado.isPresent());
        assertEquals("Juan Pérez", resultado.get().getNombre());
        verify(usuarioRepository, times(1)).findById("1");
    }

    @Test
    @DisplayName("Debe retornar Optional vacío cuando usuario no existe")
    void debeRetornarOptionalVacioCuandoUsuarioNoExiste() {
        when(usuarioRepository.findById("999")).thenReturn(Optional.empty());

        Optional<Usuario> resultado = usuarioService.obtenerPorId("999");

        assertFalse(resultado.isPresent());
        verify(usuarioRepository, times(1)).findById("999");
    }

    // ── registrar ─────────────────────────────────────────

    @Test
    @DisplayName("Debe registrar usuario hasheando la contraseña")
    void debeRegistrarUsuarioHasheandoPassword() {
        when(usuarioRepository.existsByEmail("juan@test.com")).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("$2a$10$hasheado");
        when(usuarioRepository.save(any(Usuario.class))).thenReturn(usuarioTest);

        Usuario resultado = usuarioService.registrar(
                new Usuario("1", "Juan Pérez", "juan@test.com", "123456", "Cliente"));

        assertNotNull(resultado);
        assertEquals("Juan Pérez", resultado.getNombre());
        // Verifica que se llamó al encoder antes de guardar
        verify(passwordEncoder, times(1)).encode("123456");
        verify(usuarioRepository, times(1)).save(any(Usuario.class));
    }

    @Test
    @DisplayName("Debe lanzar excepción cuando email ya existe")
    void debeLanzarExcepcionCuandoEmailYaExiste() {
        when(usuarioRepository.existsByEmail("juan@test.com")).thenReturn(true);

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> usuarioService.registrar(usuarioTest));

        assertTrue(ex.getMessage().contains("El email ya está registrado"));
        verify(usuarioRepository, never()).save(any());
        verify(passwordEncoder, never()).encode(anyString());
    }

    // ── actualizar ────────────────────────────────────────

    @Test
    @DisplayName("Debe actualizar usuario — re-hashea si se envía nueva contraseña")
    void debeActualizarUsuarioYRehashearPassword() {
        Usuario datos = new Usuario("1", "Juan Actualizado", "juan@test.com", "nueva123", "Admin");

        when(usuarioRepository.findById("1")).thenReturn(Optional.of(usuarioTest));
        when(passwordEncoder.encode("nueva123")).thenReturn("$2a$10$nuevoHash");
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(i -> i.getArgument(0));

        Usuario resultado = usuarioService.actualizar("1", datos);

        assertEquals("Juan Actualizado", resultado.getNombre());
        assertEquals("Admin", resultado.getRol());
        assertEquals("$2a$10$nuevoHash", resultado.getPassword());
        verify(passwordEncoder, times(1)).encode("nueva123");
    }

    @Test
    @DisplayName("Debe actualizar usuario sin tocar la contraseña si no se envía una nueva")
    void debeActualizarUsuarioSinCambiarPasswordSiEsBlank() {
        Usuario datos = new Usuario("1", "Juan Actualizado", "juan@test.com", "", "Cliente");

        when(usuarioRepository.findById("1")).thenReturn(Optional.of(usuarioTest));
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(i -> i.getArgument(0));

        usuarioService.actualizar("1", datos);

        // No se debe llamar al encoder si la contraseña está vacía
        verify(passwordEncoder, never()).encode(anyString());
    }

    @Test
    @DisplayName("Debe lanzar excepción al actualizar usuario que no existe")
    void debeLanzarExcepcionAlActualizarUsuarioQueNoExiste() {
        when(usuarioRepository.findById("999")).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class,
                () -> usuarioService.actualizar("999", usuarioTest));

        verify(usuarioRepository, never()).save(any());
    }

    // ── eliminar ──────────────────────────────────────────

    @Test
    @DisplayName("Debe eliminar usuario cuando existe")
    void debeEliminarUsuarioCuandoExiste() {
        when(usuarioRepository.existsById("1")).thenReturn(true);
        doNothing().when(usuarioRepository).deleteById("1");

        assertDoesNotThrow(() -> usuarioService.eliminar("1"));

        verify(usuarioRepository, times(1)).deleteById("1");
    }

    @Test
    @DisplayName("Debe lanzar excepción al eliminar usuario que no existe")
    void debeLanzarExcepcionAlEliminarUsuarioQueNoExiste() {
        when(usuarioRepository.existsById("999")).thenReturn(false);

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> usuarioService.eliminar("999"));

        assertTrue(ex.getMessage().contains("Usuario no encontrado"));
        verify(usuarioRepository, never()).deleteById(any());
    }

    // ── login ─────────────────────────────────────────────

    @Test
    @DisplayName("Login exitoso — devuelve token JWT y datos del usuario")
    void debeRetornarTokenEnLoginExitoso() {
        when(usuarioRepository.findByEmail("juan@test.com"))
                .thenReturn(Optional.of(usuarioTest));
        when(passwordEncoder.matches("123456", "$2a$10$hasheado"))
                .thenReturn(true);
        when(jwtUtils.generarToken("juan@test.com", "Cliente", "1"))
                .thenReturn("eyJhbGci.payload.signature");

        Optional<Map<String, Object>> resultado =
                usuarioService.login("juan@test.com", "123456");

        assertTrue(resultado.isPresent());
        assertEquals("eyJhbGci.payload.signature", resultado.get().get("token"));
        assertEquals("Bearer",   resultado.get().get("tipo"));
        assertEquals("1",        resultado.get().get("userId"));
        assertEquals("Cliente",  resultado.get().get("rol"));
        verify(passwordEncoder, times(1)).matches("123456", "$2a$10$hasheado");
        verify(jwtUtils,        times(1)).generarToken("juan@test.com", "Cliente", "1");
    }

    @Test
    @DisplayName("Login fallido — contraseña incorrecta")
    void debeRetornarEmptyEnLoginConPasswordIncorrecta() {
        when(usuarioRepository.findByEmail("juan@test.com"))
                .thenReturn(Optional.of(usuarioTest));
        when(passwordEncoder.matches("wrongpass", "$2a$10$hasheado"))
                .thenReturn(false);

        Optional<Map<String, Object>> resultado =
                usuarioService.login("juan@test.com", "wrongpass");

        assertFalse(resultado.isPresent());
        verify(jwtUtils, never()).generarToken(anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("Login fallido — email no registrado")
    void debeRetornarEmptyEnLoginConEmailNoRegistrado() {
        when(usuarioRepository.findByEmail("noexiste@test.com"))
                .thenReturn(Optional.empty());

        Optional<Map<String, Object>> resultado =
                usuarioService.login("noexiste@test.com", "123456");

        assertFalse(resultado.isPresent());
        verify(passwordEncoder, never()).matches(anyString(), anyString());
        verify(jwtUtils,        never()).generarToken(anyString(), anyString(), anyString());
    }
}
