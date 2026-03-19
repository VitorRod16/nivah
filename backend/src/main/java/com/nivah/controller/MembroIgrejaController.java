package com.nivah.controller;

import com.nivah.dto.MembroIgrejaRequest;
import com.nivah.dto.MembroIgrejaResponse;
import com.nivah.service.MembroIgrejaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/membros")
@RequiredArgsConstructor
public class MembroIgrejaController {

    private final MembroIgrejaService membroIgrejaService;

    @GetMapping
    public List<MembroIgrejaResponse> getAll(@AuthenticationPrincipal UserDetails user) {
        return membroIgrejaService.findAll(user.getUsername());
    }

    @PostMapping
    public ResponseEntity<?> add(@RequestBody MembroIgrejaRequest request, @AuthenticationPrincipal UserDetails user) {
        try {
            return ResponseEntity.ok(membroIgrejaService.add(request, user.getUsername()));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable UUID id, @RequestBody MembroIgrejaRequest request, @AuthenticationPrincipal UserDetails user) {
        try {
            return ResponseEntity.ok(membroIgrejaService.update(id, request, user.getUsername()));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable UUID id, @AuthenticationPrincipal UserDetails user) {
        try {
            membroIgrejaService.delete(id, user.getUsername());
            return ResponseEntity.noContent().build();
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/papeis/{papelId}")
    public ResponseEntity<?> addPapel(@PathVariable UUID id, @PathVariable UUID papelId, @AuthenticationPrincipal UserDetails user) {
        try {
            return ResponseEntity.ok(membroIgrejaService.addPapel(id, papelId, user.getUsername()));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}/papeis/{papelId}")
    public ResponseEntity<?> removePapel(@PathVariable UUID id, @PathVariable UUID papelId, @AuthenticationPrincipal UserDetails user) {
        try {
            return ResponseEntity.ok(membroIgrejaService.removePapel(id, papelId, user.getUsername()));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
