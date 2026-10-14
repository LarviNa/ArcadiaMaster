package com.arcadia.comics.config;

import com.arcadia.comics.model.Comic;
import com.arcadia.comics.repository.ComicRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class ComicDataInitializer {

    private static final Logger log = LoggerFactory.getLogger(ComicDataInitializer.class);

    @Bean
    public CommandLineRunner initComicsDatabase(ComicRepository comicRepository) {
        return args -> {
            log.info("🚀 Verificando catálogo oficial de 32 cómics en base de datos MySQL...");

            List<Comic> catalog = List.of(
                    new Comic("c001", "The Amazing Spider-Man #1", "Stan Lee", "Marvel Comics", 12990.0, 15,
                            "https://upload.wikimedia.org/wikipedia/en/3/39/TheAmazingSpider-Man_1.jpg",
                            "La legendaria primera edición en solitario del héroe arácnido. Peter Parker descubre que con un gran poder viene una gran responsabilidad.",
                            "1963-03-01", "Superhero", 36, "Español"),

                    new Comic("c002", "Batman: The Dark Knight Returns", "Frank Miller", "DC Comics", 14990.0, 10,
                            "https://upload.wikimedia.org/wikipedia/en/5/5a/Dark_knight_returns.jpg",
                            "Una Gotham distópica donde un Bruce Wayne envejecido retoma el manto de Batman para salvar su ciudad de una ola de criminalidad sin precedentes.",
                            "1986-02-01", "Superhero", 224, "Español"),

                    new Comic("c003", "X-Men: Days of Future Past", "Chris Claremont", "Marvel Comics", 11990.0, 20,
                            "https://upload.wikimedia.org/wikipedia/en/3/39/XMen141.jpg",
                            "Un futuro sombrío donde los mutantes son cazados por Centinelas. Kitty Pryde viaja en el tiempo para evitar el apocalipsis.",
                            "1981-01-01", "Sci-Fi", 144, "Español"),

                    new Comic("c004", "Watchmen", "Alan Moore", "DC Comics", 18990.0, 8,
                            "https://upload.wikimedia.org/wikipedia/en/a/a2/Watchmen%2C_issue_1.jpg",
                            "La aclamada obra maestra que deconstruye el mito de los superhéroes en plena Guerra Fría. ¿Quién vigila a los vigilantes?",
                            "1986-09-01", "Historical", 416, "Español"),

                    new Comic("c005", "Naruto Vol. 1", "Masashi Kishimoto", "Shueisha", 8990.0, 25,
                            "https://upload.wikimedia.org/wikipedia/en/9/94/NarutoCoverTankobon1.jpg",
                            "El comienzo del viaje del joven ninja marginado Naruto Uzumaki en su camino para convertirse en Hokage de la Aldea de la Hoja.",
                            "2000-03-03", "Fantasy", 192, "Español"),

                    new Comic("c006", "Attack on Titan Vol. 1", "Hajime Isayama", "Kodansha", 9990.0, 18,
                            "https://upload.wikimedia.org/wikipedia/en/d/d6/AttackonTitan1.jpg",
                            "La humanidad sobrevive encerrada tras tres muros gigantescos para protegerse de titanes devoradores. Eren Jaeger jura venganza.",
                            "2010-03-17", "Horror", 196, "Español"),

                    new Comic("c007", "One Piece Vol. 1", "Eiichiro Oda", "Shueisha", 8990.0, 30,
                            "https://upload.wikimedia.org/wikipedia/en/6/6d/One_Piece%2C_Volume_61_Cover_%28Japanese%29.jpg",
                            "Monkey D. Luffy se lanza a los mares en busca del mítico tesoro One Piece para convertirse en el Rey de los Piratas.",
                            "1997-12-24", "Fantasy", 208, "Español"),

                    new Comic("c008", "Avengers: Infinity War", "Jim Starlin", "Marvel Comics", 13990.0, 12,
                            "https://upload.wikimedia.org/wikipedia/en/e/e2/Avengers_Infinity_Gauntlet.jpg",
                            "Thanos reúne las seis Gemas del Infinito en su guantelete para redefinir el cosmos con un simple chasquido de dedos.",
                            "1991-07-01", "Superhero", 260, "Español"),

                    new Comic("c009", "Batman: Year One", "Frank Miller", "DC Comics", 11990.0, 14,
                            "https://upload.wikimedia.org/wikipedia/en/4/44/Batman_Year_One.jpg",
                            "El origen definitivo del Caballero Oscuro y los primeros pasos de James Gordon en el corrupto departamento de Gotham.",
                            "1987-02-01", "Superhero", 144, "Español"),

                    new Comic("c010", "Dragon Ball Vol. 1", "Akira Toriyama", "Shueisha", 8990.0, 22,
                            "https://upload.wikimedia.org/wikipedia/en/7/7e/DragonBallVolume1.jpg",
                            "El legendario inicio de las aventuras de Goku y Bulma en busca de las místicas siete Esferas del Dragón.",
                            "1985-09-10", "Fantasy", 192, "Español"),

                    new Comic("c011", "Iron Man: Extremis", "Warren Ellis", "Marvel Comics", 12990.0, 9,
                            "https://upload.wikimedia.org/wikipedia/en/8/81/Iron_man_extremis.jpg",
                            "Tony Stark debe actualizar su propia biología y armadura tras el surgimiento del suero biotecnológico Extremis.",
                            "2005-01-01", "Sci-Fi", 160, "Español"),

                    new Comic("c012", "Demon Slayer Vol. 1", "Koyoharu Gotouge", "Shueisha", 9990.0, 20,
                            "https://upload.wikimedia.org/wikipedia/en/4/45/Kimetsu_no_Yaiba_Volume_1.jpg",
                            "Tanjiro Kamado emprende un camino peligroso como cazador de demonios para encontrar una cura para su hermana Nezuko.",
                            "2016-06-03", "Horror", 192, "Español"),

                    new Comic("c013", "Berserk Vol. 1", "Kentaro Miura", "Hakusensha", 10990.0, 12,
                            "https://upload.wikimedia.org/wikipedia/en/4/45/Berserk_vol01.jpg",
                            "Guts, el legendario Espadachín Negro, empuña su gigantesca espada buscando venganza contra los Apóstoles y la Mano de Dios.",
                            "1990-11-26", "Dark Fantasy", 224, "Español"),

                    new Comic("c014", "Jujutsu Kaisen Vol. 1", "Gege Akutami", "Shueisha", 8490.0, 16,
                            "https://upload.wikimedia.org/wikipedia/en/7/77/Jujutsu_kaisen_vol_1.png",
                            "Yuji Itadori traga un dedo maldito de Ryomen Sukuna, ingresando al oculto y peligroso mundo de la hechicería jujutsu.",
                            "2018-12-04", "Supernatural", 192, "Español"),

                    new Comic("c015", "Death Note Vol. 1", "Tsugumi Ohba", "Shueisha", 9490.0, 15,
                            "https://upload.wikimedia.org/wikipedia/en/6/6f/Death_Note_Vol_1.jpg",
                            "Light Yagami encuentra una libreta sobrenatural con el poder de quitarle la vida a quien tenga su nombre escrito en ella.",
                            "2004-04-02", "Mystery", 200, "Español"),

                    new Comic("c016", "Chainsaw Man Vol. 1", "Tatsuki Fujimoto", "Shueisha", 8990.0, 24,
                            "https://upload.wikimedia.org/wikipedia/en/e/eb/Chainsaw_Man_volume_1_cover.jpg",
                            "Denji, un joven endeudado que vive como cazador de demonios junto a Pochita, renace como el imparable Hombre Motosierra.",
                            "2019-03-04", "Action", 192, "Español"),

                    new Comic("c017", "Tokyo Ghoul Vol. 1", "Sui Ishida", "Shueisha", 9290.0, 14,
                            "https://upload.wikimedia.org/wikipedia/en/e/e5/Tokyo_Ghoul_volume_1_cover.jpg",
                            "Ken Kaneki sobrevive a un ataque mortal solo para convertirse en un híbrido mitad humano mitad ghoul en las calles de Tokio.",
                            "2012-02-17", "Horror", 224, "Español"),

                    new Comic("c018", "Fullmetal Alchemist Vol. 1", "Hiromu Arakawa", "Square Enix", 9990.0, 18,
                            "https://upload.wikimedia.org/wikipedia/en/9/9d/Fullmetal1.jpg",
                            "Los hermanos Edward y Alphonse Elric desafían el tabú de la transmutación humana para intentar recuperar sus cuerpos.",
                            "2002-01-22", "Fantasy", 192, "Español"),

                    new Comic("c019", "Bleach Vol. 1", "Tite Kubo", "Shueisha", 8490.0, 20,
                            "https://upload.wikimedia.org/wikipedia/en/7/72/Bleach_cover_01.jpg",
                            "Ichigo Kurosaki obtiene los poderes de un Segador de Almas tras conocer a Rukia Kuchiki y defender a su familia de los Hollows.",
                            "2002-01-05", "Supernatural", 192, "Español"),

                    new Comic("c020", "My Hero Academia Vol. 1", "Kohei Horikoshi", "Shueisha", 8990.0, 22,
                            "https://upload.wikimedia.org/wikipedia/en/5/5a/Boku_no_Hero_Academia_Volume_1.png",
                            "En un mundo donde el 80% de la población posee dones, Izuku Midoriya nace sin poderes pero sueña con ser el héroe número uno.",
                            "2014-11-04", "Superhero", 192, "Español"),

                    new Comic("c021", "Hunter x Hunter Vol. 1", "Yoshihiro Togashi", "Shueisha", 9490.0, 16,
                            "https://upload.wikimedia.org/wikipedia/en/0/00/Hunter_%C3%97_Hunter_vol._1.png",
                            "Gon Freecss decide tomar el durísimo Examen de Cazador para seguir los pasos de su padre y recorrer mundos desconocidos.",
                            "1998-06-04", "Adventure", 192, "Español"),

                    new Comic("c022", "Deadpool Kills the Marvel Universe", "Cullen Bunn", "Marvel Comics", 11490.0, 11,
                            "https://upload.wikimedia.org/wikipedia/en/b/b3/Deadpool_Kills_the_Marvel_Universe_1.jpg",
                            "El Mercenario Bocazas pierde el control de su psique y decide acabar despiadadamente con todos los héroes del universo Marvel.",
                            "2012-10-10", "Superhero", 96, "Español"),

                    new Comic("c023", "Daredevil: Born Again", "Frank Miller", "Marvel Comics", 13990.0, 10,
                            "https://upload.wikimedia.org/wikipedia/en/6/60/Daredevil227.jpg",
                            "Kingpin descubre la verdadera identidad de Daredevil y destruye sistemáticamente la vida de Matt Murdock en su obra cumbre.",
                            "1986-02-01", "Superhero", 176, "Español"),

                    new Comic("c024", "Wolverine: Old Man Logan", "Mark Millar", "Marvel Comics", 14490.0, 13,
                            "https://upload.wikimedia.org/wikipedia/en/6/69/Wolverine_Old_Man_Logan.jpg",
                            "Cincuenta años después de la caída de los héroes, un Logan pacífico y envejecido emprende un último viaje a través de una América destruida.",
                            "2008-06-01", "Sci-Fi", 224, "Español"),

                    new Comic("c025", "Civil War", "Mark Millar", "Marvel Comics", 15990.0, 15,
                            "https://upload.wikimedia.org/wikipedia/en/f/fb/Civil_War_1.jpg",
                            "La ley de registro sobrehumano fractura la comunidad de héroes, obligando a Iron Man y al Capitán América a enfrentarse a muerte.",
                            "2006-07-01", "Superhero", 208, "Español"),

                    new Comic("c026", "All-Star Superman", "Grant Morrison", "DC Comics", 14990.0, 12,
                            "https://upload.wikimedia.org/wikipedia/en/4/4b/All_Star_Superman_1.jpg",
                            "Herido mortalmente por una sobrecarga solar, Superman pasa sus últimos días completando doce tareas heroicas por el destino de la Tierra.",
                            "2006-01-01", "Superhero", 304, "Español"),

                    new Comic("c027", "Flashpoint", "Geoff Johns", "DC Comics", 13490.0, 14,
                            "https://upload.wikimedia.org/wikipedia/en/1/14/Flashpoint_1.jpg",
                            "Barry Allen despierta en una línea temporal distorsionada donde la Liga de la Justicia no existe y Atlantis está en guerra con Themyscira.",
                            "2011-05-01", "Sci-Fi", 176, "Español"),

                    new Comic("c028", "The Sandman: Preludes & Nocturnes", "Neil Gaiman", "DC Vertigo", 17990.0, 9,
                            "https://upload.wikimedia.org/wikipedia/en/3/30/Sandman_1.jpg",
                            "Tras setenta años de cautiverio, Sueño de los Eternos escapa y emprende una odisea por recuperar sus tres símbolos de poder.",
                            "1989-01-01", "Dark Fantasy", 240, "Español"),

                    new Comic("c029", "V for Vendetta", "Alan Moore", "DC Vertigo", 16490.0, 10,
                            "https://upload.wikimedia.org/wikipedia/en/b/b0/Vforvendettax.jpg",
                            "En una Gran Bretaña gobernada por un régimen fascista totalitario, un justiciero enmascarado conocido como V inicia una revolución.",
                            "1988-09-01", "Historical", 296, "Español"),

                    new Comic("c030", "Kingdom Come", "Mark Waid", "DC Comics", 15490.0, 8,
                            "https://upload.wikimedia.org/wikipedia/en/0/05/Kingdom_come_1.jpg",
                            "En un futuro apocalíptico donde una nueva generación de vigilantes causa estragos, la vieja guardia de héroes regresa para imponer orden.",
                            "1996-05-01", "Superhero", 232, "Español"),

                    new Comic("c031", "Venom: Lethal Protector", "David Michelinie", "Marvel Comics", 12490.0, 17,
                            "https://upload.wikimedia.org/wikipedia/en/4/47/Venom_Lethal_Protector_1.jpg",
                            "Eddie Brock se traslada a San Francisco buscando empezar de nuevo como protector letal, pero un ejército de simbiontes acecha en las sombras.",
                            "1993-02-01", "Superhero", 144, "Español"),

                    new Comic("c032", "Akira Vol. 1", "Katsuhiro Otomo", "Kodansha", 19990.0, 7,
                            "https://upload.wikimedia.org/wikipedia/en/a/a2/Akira_vol01.jpg",
                            "En el Neo-Tokio post-apocalíptico del año 2019, pandillas de motociclistas se topan con un peligroso proyecto militar de telequinesis.",
                            "1984-09-21", "Sci-Fi", 364, "Español")
            );

            int insertedCount = 0;
            for (Comic c : catalog) {
                if (!comicRepository.existsById(c.getId())) {
                    comicRepository.save(c);
                    insertedCount++;
                }
            }

            log.info("✅ Catálogo sincronizado en MySQL (Nuevos insertados: {}, Total en base de datos: {}).",
                    insertedCount, comicRepository.count());
        };
    }
}
