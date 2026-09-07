package com.arcadia.comics.service;

import com.arcadia.comics.model.Comic;
import com.arcadia.comics.repository.ComicRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class ComicService {

    private final ComicRepository comicRepository;

    public ComicService(ComicRepository comicRepository) {
        this.comicRepository = comicRepository;
    }

    public List<Comic> getAllComics() {
        return comicRepository.findAll();
    }

    public Optional<Comic> getComicById(String id) {
        return comicRepository.findById(id);
    }

    public Comic createComic(Comic comic) {
        if (comic.getId() == null || comic.getId().isEmpty()) {
            comic.setId(UUID.randomUUID().toString());
        }
        return comicRepository.save(comic);
    }

    public Optional<Comic> updateComic(String id, Comic updatedComic) {
        return comicRepository.findById(id).map(comic -> {
            comic.setTitle(updatedComic.getTitle());
            comic.setAuthor(updatedComic.getAuthor());
            comic.setPublisher(updatedComic.getPublisher());
            comic.setPrice(updatedComic.getPrice());
            comic.setStock(updatedComic.getStock());
            comic.setCoverImage(updatedComic.getCoverImage());
            comic.setDescription(updatedComic.getDescription());
            comic.setReleaseDate(updatedComic.getReleaseDate());
            comic.setGenre(updatedComic.getGenre());
            comic.setPages(updatedComic.getPages());
            comic.setLanguage(updatedComic.getLanguage());
            return comicRepository.save(comic);
        });
    }

    public boolean deleteComic(String id) {
        if (comicRepository.existsById(id)) {
            comicRepository.deleteById(id);
            return true;
        }
        return false;
    }
}