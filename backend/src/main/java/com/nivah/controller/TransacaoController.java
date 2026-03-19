package com.nivah.controller;

import com.nivah.dto.TransacaoRequest;
import com.nivah.model.Transacao;
import com.nivah.service.TransacaoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/transacoes")
@RequiredArgsConstructor
public class TransacaoController {

    private final TransacaoService transacaoService;

    @GetMapping
    public List<Transacao> getAll(@AuthenticationPrincipal UserDetails user) {
        return transacaoService.findAll(user.getUsername());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody TransacaoRequest request, @AuthenticationPrincipal UserDetails user) {
        try {
            return ResponseEntity.ok(transacaoService.create(request, user.getUsername()));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable UUID id, @RequestBody TransacaoRequest request, @AuthenticationPrincipal UserDetails user) {
        try {
            return ResponseEntity.ok(transacaoService.update(id, request, user.getUsername()));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable UUID id, @AuthenticationPrincipal UserDetails user) {
        try {
            transacaoService.delete(id, user.getUsername());
            return ResponseEntity.noContent().build();
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
