-- =========================================================
-- Script de inicialización de bases de datos — Arcadia Comics
-- Ejecutar en MySQL Workbench ANTES de levantar los microservicios
-- =========================================================

-- 1. Base de datos de Usuarios
CREATE DATABASE IF NOT EXISTS arcadia_usuarios
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- 2. Base de datos de Comics
CREATE DATABASE IF NOT EXISTS arcadia_comics
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- 3. Base de datos de Ventas
CREATE DATABASE IF NOT EXISTS arcadia_ventas
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- Verificar que se crearon correctamente
SELECT schema_name AS 'Base de datos creada'
FROM information_schema.schemata
WHERE schema_name IN ('arcadia_usuarios', 'arcadia_comics', 'arcadia_ventas');

-- NOTA: Las tablas se crean automáticamente al arrancar cada microservicio
-- gracias a spring.jpa.hibernate.ddl-auto=update

-- =========================================================
-- DATOS DE PRUEBA — ejecutar DESPUÉS de haber arrancado
-- todos los microservicios al menos una vez (para que
-- Hibernate cree las tablas automáticamente)
-- =========================================================

-- ---------------------------------------------------------
-- Comics de prueba (12 títulos)
-- ---------------------------------------------------------
USE arcadia_comics;

CREATE TABLE IF NOT EXISTS comics (
    id VARCHAR(50) PRIMARY KEY,
    titulo VARCHAR(255),
    autor VARCHAR(255),
    editorial VARCHAR(255),
    precio DECIMAL(10,2),
    stock INT,
    imagen_url VARCHAR(500)
);

INSERT IGNORE INTO comics (id, titulo, autor, editorial, precio, stock, imagen_url) VALUES
('c001', 'The Amazing Spider-Man #1',      'Stan Lee',          'Marvel Comics',   12990, 15, 'https://upload.wikimedia.org/wikipedia/en/3/39/TheAmazingSpider-Man_1.jpg'),
('c002', 'Batman: The Dark Knight Returns','Frank Miller',      'DC Comics',       14990, 10, 'https://upload.wikimedia.org/wikipedia/en/5/5a/Dark_knight_returns.jpg'),
('c003', 'X-Men: Days of Future Past',     'Chris Claremont',  'Marvel Comics',   11990, 20, 'https://upload.wikimedia.org/wikipedia/en/3/39/XMen141.jpg'),
('c004', 'Watchmen',                       'Alan Moore',       'DC Comics',       18990,  8, 'https://upload.wikimedia.org/wikipedia/en/a/a2/Watchmen%2C_issue_1.jpg'),
('c005', 'Naruto Vol. 1',                  'Masashi Kishimoto','Shueisha',         8990, 25, 'https://upload.wikimedia.org/wikipedia/en/9/94/NarutoCoverTankobon1.jpg'),
('c006', 'Attack on Titan Vol. 1',         'Hajime Isayama',   'Kodansha',         9990, 18, 'https://upload.wikimedia.org/wikipedia/en/d/d6/AttackonTitan1.jpg'),
('c007', 'One Piece Vol. 1',               'Eiichiro Oda',     'Shueisha',         8990, 30, 'https://upload.wikimedia.org/wikipedia/en/6/6d/One_Piece%2C_Volume_61_Cover_%28Japanese%29.jpg'),
('c008', 'Avengers: Infinity War',         'Jim Starlin',      'Marvel Comics',   13990, 12, 'https://upload.wikimedia.org/wikipedia/en/e/e2/Avengers_Infinity_Gauntlet.jpg'),
('c009', 'Batman: Year One',               'Frank Miller',     'DC Comics',       11990, 14, 'https://upload.wikimedia.org/wikipedia/en/4/44/Batman_Year_One.jpg'),
('c010', 'Dragon Ball Vol. 1',             'Akira Toriyama',   'Shueisha',         8990, 22, 'https://upload.wikimedia.org/wikipedia/en/7/7e/DragonBallVolume1.jpg'),
('c011', 'Iron Man: Extremis',             'Warren Ellis',     'Marvel Comics',   12990,  9, 'https://upload.wikimedia.org/wikipedia/en/8/81/Iron_man_extremis.jpg'),
('c012', 'Demon Slayer Vol. 1',            'Koyoharu Gotouge', 'Shueisha',         9990, 20, 'https://upload.wikimedia.org/wikipedia/en/4/45/Kimetsu_no_Yaiba_Volume_1.jpg');

SELECT CONCAT('Comics insertados: ', COUNT(*)) AS resultado FROM comics;

-- ---------------------------------------------------------
-- Usuario ADMIN de prueba
-- Email:    admin@arcadia.com
-- Password: Admin1234!   (hasheado con BCrypt)
-- ---------------------------------------------------------
USE arcadia_usuarios;

INSERT IGNORE INTO usuarios (id, nombre, email, password, rol, foto_perfil_uri)
VALUES (
    'u001',
    'Administrador',
    'admin@arcadia.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',  -- Admin1234!
    'ADMIN',
    NULL
);

-- Usuario CLIENTE de prueba
-- Email:    cliente@arcadia.com
-- Password: Cliente1234!
INSERT IGNORE INTO usuarios (id, nombre, email, password, rol, foto_perfil_uri)
VALUES (
    'u002',
    'Cliente Demo',
    'cliente@arcadia.com',
    '$2a$10$TKh8H1.PfQx37YgCzwiKb.KjNyWgaHb9cbcoQgdIV87CSxkAthydO',  -- Cliente1234!
    'CLIENTE',
    NULL
);

SELECT email, rol AS 'Usuarios de prueba creados' FROM usuarios WHERE id IN ('u001','u002');
