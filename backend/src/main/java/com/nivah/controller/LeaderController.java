package com.nivah.controller;

import com.nivah.model.Leadership;
import com.nivah.repository.LeadershipRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/leaders")
@RequiredArgsConstructor
public class LeaderController {

    private final LeadershipRepository leadershipRepository;

    @GetMapping
    public ResponseEntity<List<Leadership>> getAll() {
        return ResponseEntity.ok(leadershipRepository.findAll());
    }

    @PostMapping
    public ResponseEntity<Leadership> create(@RequestBody Leadership leadership) {
        Leadership saved = leadershipRepository.save(leadership);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Leadership> update(@PathVariable UUID id, @RequestBody Leadership leadership) {
        if (!leadershipRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        leadership.setId(id);
        Leadership saved = leadershipRepository.save(leadership);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        if (!leadershipRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        leadershipRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
