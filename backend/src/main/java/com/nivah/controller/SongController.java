package com.nivah.controller;

import com.nivah.model.Song;
import com.nivah.repository.SongRepository;
import com.nivah.service.ChurchAccessService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/songs")
@RequiredArgsConstructor
public class SongController {

    private final SongRepository songRepository;
    private final ChurchAccessService churchAccessService;

    @GetMapping
    public ResponseEntity<List<Song>> getAll(@AuthenticationPrincipal UserDetails userDetails) {
        String email = userDetails.getUsername();
        if (churchAccessService.isAdmin(email)) {
            return ResponseEntity.ok(songRepository.findAll());
        }
        List<UUID> igrejaIds = churchAccessService.getAccessibleIgrejaIds(email);
        return ResponseEntity.ok(songRepository.findByIgrejaIdIn(igrejaIds));
    }

    @PostMapping
    public ResponseEntity<Song> create(@RequestBody Song song) {
        Song saved = songRepository.save(song);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Song> update(@PathVariable UUID id, @RequestBody Song song) {
        if (!songRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        song.setId(id);
        Song saved = songRepository.save(song);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        if (!songRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        songRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
