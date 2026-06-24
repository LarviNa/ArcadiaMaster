package com.arcadia.comics.controller;

import com.arcadia.comics.model.Comic;
import com.arcadia.comics.service.ComicService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/comics")
public class ComicController {

    private final ComicService comicService;

    public ComicController(ComicService comicService) {
        this.comicService = comicService;
    }

    @GetMapping
    public ResponseEntity<List<Comic>> getAllComics() {
        return ResponseEntity.ok(comicService.getAllComics());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Comic> getComicById(@PathVariable String id) {
        Optional<Comic> comic = comicService.getComicById(id);
        return comic.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    @PostMapping
    public ResponseEntity<Comic> createComic(@RequestBody Comic comic) {
        Comic createdComic = comicService.createComic(comic);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdComic);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Comic> updateComic(@PathVariable String id, @RequestBody Comic comic) {
        Optional<Comic> updatedComic = comicService.updateComic(id, comic);
        return updatedComic.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteComic(@PathVariable String id) {
        boolean deleted = comicService.deleteComic(id);
        if (deleted) {
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @GetMapping("/health")
    public ResponseEntity<java.util.Map<String, String>> health() {
        return ResponseEntity.ok(java.util.Map.of(
                "status", "UP",
                "service", "microservicio-comics",
                "port", "8081"
        ));
    }
}
