package com.nivah.controller;

import com.nivah.dto.PapelRequest;
import com.nivah.model.Papel;
import com.nivah.service.PapelService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/igrejas/{igrejaId}/papeis")
@RequiredArgsConstructor
public class PapelController {

    private final PapelService papelService;

    @GetMapping
    public List<Papel> getAll(@PathVariable UUID igrejaId, @AuthenticationPrincipal UserDetails user) {
        return papelService.findByIgreja(igrejaId, user.getUsername());
    }

    @PostMapping
    public ResponseEntity<?> create(@PathVariable UUID igrejaId, @RequestBody PapelRequest request, @AuthenticationPrincipal UserDetails user) {
        try {
            return ResponseEntity.ok(papelService.create(igrejaId, request, user.getUsername()));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{papelId}")
    public ResponseEntity<?> delete(@PathVariable UUID igrejaId, @PathVariable UUID papelId, @AuthenticationPrincipal UserDetails user) {
        try {
            papelService.delete(igrejaId, papelId, user.getUsername());
            return ResponseEntity.noContent().build();
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        }
    }
}
