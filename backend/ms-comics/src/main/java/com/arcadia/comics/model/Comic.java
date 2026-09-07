package com.arcadia.comics.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PostLoad;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "comics")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Comic {
    @Id
    private String id;

    @Column(name = "titulo")
    private String title;

    @Column(name = "autor")
    private String author;

    @Column(name = "editorial")
    private String publisher;

    @Column(name = "precio")
    private Double price;

    @Column(name = "stock")
    private Integer stock;

    @Column(name = "imagen_url")
    private String coverImage;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description = "No description available.";

    @Column(name = "release_date")
    private String releaseDate = "2024-01-01";

    @Column(name = "genre")
    private String genre = "Superhero";

    @Column(name = "pages")
    private Integer pages = 100;

    @Column(name = "language")
    private String language = "English";

    @PostLoad
    private void onLoad() {
        if (description == null) {
            description = "No description available.";
        }
        if (releaseDate == null) {
            releaseDate = "2024-01-01";
        }
        if (genre == null) {
            genre = "Superhero";
        }
        if (pages == null) {
            pages = 100;
        }
        if (language == null) {
            language = "English";
        }
    }
}
