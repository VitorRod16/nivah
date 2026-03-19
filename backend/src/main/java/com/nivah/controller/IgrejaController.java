package com.nivah.controller;

import com.nivah.dto.IgrejaPublicResponse;
import com.nivah.dto.IgrejaRequest;
import com.nivah.model.Igreja;
import com.nivah.service.IgrejaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/igrejas")
@RequiredArgsConstructor
public class IgrejaController {

    private final IgrejaService igrejaService;

    @GetMapping
    public ResponseEntity<?> getAll(@AuthenticationPrincipal UserDetails user) {
        if (user == null) {
            List<IgrejaPublicResponse> list = igrejaService.findAllPublic().stream()
                    .map(IgrejaPublicResponse::from)
                    .toList();
            return ResponseEntity.ok(list);
        }
        return ResponseEntity.ok(igrejaService.findAll(user.getUsername()));
    }

    @GetMapping("/{id}")
    public Igreja getById(@PathVariable UUID id, @AuthenticationPrincipal UserDetails user) {
        return igrejaService.findById(id, user.getUsername());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody IgrejaRequest request, @AuthenticationPrincipal UserDetails user) {
        try {
            return ResponseEntity.ok(igrejaService.create(request, user.getUsername()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable UUID id, @RequestBody IgrejaRequest request, @AuthenticationPrincipal UserDetails user) {
        try {
            return ResponseEntity.ok(igrejaService.update(id, request, user.getUsername()));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable UUID id, @AuthenticationPrincipal UserDetails user) {
        try {
            igrejaService.delete(id, user.getUsername());
            return ResponseEntity.noContent().build();
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{igrejaId}/pastores/{usuarioId}")
    public ResponseEntity<?> addPastor(@PathVariable UUID igrejaId, @PathVariable UUID usuarioId, @AuthenticationPrincipal UserDetails user) {
        try {
            return ResponseEntity.ok(igrejaService.addPastor(igrejaId, usuarioId, user.getUsername()));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{igrejaId}/pastores/{usuarioId}")
    public ResponseEntity<?> removePastor(@PathVariable UUID igrejaId, @PathVariable UUID usuarioId, @AuthenticationPrincipal UserDetails user) {
        try {
            return ResponseEntity.ok(igrejaService.removePastor(igrejaId, usuarioId, user.getUsername()));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        }
    }
}
