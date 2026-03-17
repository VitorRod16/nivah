package com.nivah.controller;

import com.nivah.model.Study;
import com.nivah.repository.StudyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/studies")
@RequiredArgsConstructor
public class StudyController {

    private final StudyRepository studyRepository;

    @GetMapping
    public ResponseEntity<List<Study>> getAll() {
        return ResponseEntity.ok(studyRepository.findAll());
    }

    @PostMapping
    public ResponseEntity<Study> create(@RequestBody Study study) {
        Study saved = studyRepository.save(study);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Study> update(@PathVariable UUID id, @RequestBody Study study) {
        if (!studyRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        study.setId(id);
        Study saved = studyRepository.save(study);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        if (!studyRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        studyRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
