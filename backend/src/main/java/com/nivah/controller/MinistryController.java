package com.nivah.controller;

import com.nivah.model.Ministry;
import com.nivah.repository.MinistryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/ministries")
@RequiredArgsConstructor
public class MinistryController {

    private final MinistryRepository ministryRepository;

    @GetMapping
    public ResponseEntity<List<Ministry>> getAll() {
        return ResponseEntity.ok(ministryRepository.findAll());
    }

    @PostMapping
    public ResponseEntity<Ministry> create(@RequestBody Ministry ministry) {
        Ministry saved = ministryRepository.save(ministry);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Ministry> update(@PathVariable UUID id, @RequestBody Ministry ministry) {
        if (!ministryRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        ministry.setId(id);
        Ministry saved = ministryRepository.save(ministry);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        if (!ministryRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        ministryRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
