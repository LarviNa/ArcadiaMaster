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
            if (comicRepository.count() > 0) {
                log.info("📚 Base de datos de cómics ya inicializada (total: {} títulos).", comicRepository.count());
                return;
            }

            log.info("🚀 Inicializando catálogo oficial de cómics en base de datos MySQL...");

            List<Comic> defaultComics = List.of(
                    new Comic(
                            "c001",
                            "The Amazing Spider-Man #1",
                            "Stan Lee",
                            "Marvel Comics",
                            12990.0,
                            15,
                            "https://upload.wikimedia.org/wikipedia/en/3/39/TheAmazingSpider-Man_1.jpg",
                            "La legendaria primera edición en solitario del héroe arácnido. Peter Parker descubre que con un gran poder viene una gran responsabilidad.",
                            "1963-03-01",
                            "Superhero",
                            36,
                            "Español"
                    ),
                    new Comic(
                            "c002",
                            "Batman: The Dark Knight Returns",
                            "Frank Miller",
                            "DC Comics",
                            14990.0,
                            10,
                            "https://upload.wikimedia.org/wikipedia/en/5/5a/Dark_knight_returns.jpg",
                            "Una Gotham distópica donde un Bruce Wayne envejecido retoma el manto de Batman para salvar su ciudad de una ola de criminalidad sin precedentes.",
                            "1986-02-01",
                            "Superhero",
                            224,
                            "Español"
                    ),
                    new Comic(
                            "c003",
                            "X-Men: Days of Future Past",
                            "Chris Claremont",
                            "Marvel Comics",
                            11990.0,
                            20,
                            "https://upload.wikimedia.org/wikipedia/en/3/39/XMen141.jpg",
                            "Un futuro sombrío donde los mutantes son cazados por Centinelas. Kitty Pryde viaja en el tiempo para evitar el asesinato que detonó el apocalipsis.",
                            "1981-01-01",
                            "Sci-Fi",
                            144,
                            "Español"
                    ),
                    new Comic(
                            "c004",
                            "Watchmen",
                            "Alan Moore",
                            "DC Comics",
                            18990.0,
                            8,
                            "https://upload.wikimedia.org/wikipedia/en/a/a2/Watchmen%2C_issue_1.jpg",
                            "La aclamada obra maestra que deconstruye el mito de los superhéroes en plena Guerra Fría. ¿Quién vigila a los vigilantes?",
                            "1986-09-01",
                            "Historical",
                            416,
                            "Español"
                    ),
                    new Comic(
                            "c005",
                            "Naruto Vol. 1",
                            "Masashi Kishimoto",
                            "Shueisha",
                            8990.0,
                            25,
                            "https://upload.wikimedia.org/wikipedia/en/9/94/NarutoCoverTankobon1.jpg",
                            "El comienzo del viaje del joven ninja marginado Naruto Uzumaki en su camino para convertirse en el próximo Hokage de la Aldea de la Hoja.",
                            "2000-03-03",
                            "Fantasy",
                            192,
                            "Español"
                    ),
                    new Comic(
                            "c006",
                            "Attack on Titan Vol. 1",
                            "Hajime Isayama",
                            "Kodansha",
                            9990.0,
                            18,
                            "https://upload.wikimedia.org/wikipedia/en/d/d6/AttackonTitan1.jpg",
                            "La humanidad sobrevive encerrada tras tres muros gigantescos para protegerse de titanes devoradores de humanos. Eren Jaeger jura venganza.",
                            "2010-03-17",
                            "Horror",
                            196,
                            "Español"
                    ),
                    new Comic(
                            "c007",
                            "One Piece Vol. 1",
                            "Eiichiro Oda",
                            "Shueisha",
                            8990.0,
                            30,
                            "https://upload.wikimedia.org/wikipedia/en/6/6d/One_Piece%2C_Volume_61_Cover_%28Japanese%29.jpg",
                            "Monkey D. Luffy se lanza a los mares en busca del mítico tesoro \"One Piece\" para convertirse en el Rey de los Piratas.",
                            "1997-12-24",
                            "Fantasy",
                            208,
                            "Español"
                    ),
                    new Comic(
                            "c008",
                            "Berserk Vol. 1",
                            "Kentaro Miura",
                            "Hakusensha",
                            10990.0,
                            12,
                            "https://upload.wikimedia.org/wikipedia/en/4/45/Berserk_vol01.jpg",
                            "Guts, el legendario Espadachín Negro, empuña su gigantesca espada buscando venganza contra los Apóstoles y la Mano de Dios.",
                            "1990-11-26",
                            "Dark Fantasy",
                            224,
                            "Español"
                    ),
                    new Comic(
                            "c009",
                            "Demon Slayer Vol. 1",
                            "Koyoharu Gotouge",
                            "Shueisha",
                            7990.0,
                            15,
                            "https://upload.wikimedia.org/wikipedia/en/0/09/Demon_Slayer_-_Kimetsu_no_Yaiba%2C_volume_1.jpg",
                            "Tanjiro Kamado emprende un peligroso viaje como cazador de demonios para vengar a su familia y curar a su hermana Nezuko.",
                            "2016-06-03",
                            "Action",
                            192,
                            "Español"
                    ),
                    new Comic(
                            "c010",
                            "Dragon Ball Vol. 1",
                            "Akira Toriyama",
                            "Shueisha",
                            8490.0,
                            22,
                            "https://upload.wikimedia.org/wikipedia/en/c/c9/DB_Tank%C5%8Dbon_01.jpg",
                            "El legendario inicio de las aventuras de Goku y Bulma en busca de las místicas siete Esferas del Dragón.",
                            "1985-09-10",
                            "Adventure",
                            192,
                            "Español"
                    ),
                    new Comic(
                            "c011",
                            "Jujutsu Kaisen Vol. 1",
                            "Gege Akutami",
                            "Shueisha",
                            8490.0,
                            14,
                            "https://upload.wikimedia.org/wikipedia/en/7/77/Jujutsu_kaisen_vol_1.png",
                            "Yuji Itadori traga un dedo maldito del temible Ryomen Sukuna, ingresando al oculto y peligroso mundo de la hechicería jujutsu.",
                            "2018-12-04",
                            "Supernatural",
                            192,
                            "Español"
                    ),
                    new Comic(
                            "c012",
                            "Death Note Vol. 1",
                            "Tsugumi Ohba",
                            "Shueisha",
                            9490.0,
                            16,
                            "https://upload.wikimedia.org/wikipedia/en/6/6f/Death_Note_Vol_1.jpg",
                            "Light Yagami encuentra una libreta sobrenatural con el poder de matar a cualquier persona cuyo nombre sea escrito en ella.",
                            "2004-04-02",
                            "Mystery",
                            200,
                            "Español"
                    )
            );

            comicRepository.saveAll(defaultComics);
            log.info("✅ 12 títulos de cómics insertados exitosamente en MySQL con stock inicial.");
        };
    }
}
