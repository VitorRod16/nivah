package com.nivah.controller;

import com.nivah.model.Ministry;
import com.nivah.repository.MinistryRepository;
import com.nivah.service.ChurchAccessService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/ministries")
@RequiredArgsConstructor
public class MinistryController {

    private final MinistryRepository ministryRepository;
    private final ChurchAccessService churchAccessService;

    @GetMapping
    public ResponseEntity<List<Ministry>> getAll(@AuthenticationPrincipal UserDetails userDetails) {
        String email = userDetails.getUsername();
        if (churchAccessService.isAdmin(email)) {
            return ResponseEntity.ok(ministryRepository.findAll());
        }
        List<UUID> igrejaIds = churchAccessService.getAccessibleIgrejaIds(email);
        return ResponseEntity.ok(ministryRepository.findByIgrejaIdIn(igrejaIds));
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
