package com.nivah.controller;

import com.nivah.dto.InvitationRequest;
import com.nivah.model.Invitation;
import com.nivah.service.InvitationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/invitations")
@RequiredArgsConstructor
public class InvitationController {

    private final InvitationService invitationService;

    @GetMapping
    public List<Invitation> getAll() {
        return invitationService.findAll();
    }

    @PostMapping("/draft")
    public ResponseEntity<?> saveDraft(@RequestBody InvitationRequest request) {
        try {
            Invitation saved = invitationService.saveDraft(request);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Falha ao salvar rascunho: " + e.getMessage()));
        }
    }

    @PostMapping("/send")
    public ResponseEntity<?> send(@RequestBody InvitationRequest request) {
        try {
            InvitationService.SendResult result = invitationService.sendInvitations(request);
            return ResponseEntity.ok(Map.of(
                    "sent", result.sent(),
                    "invitation", result.invitation()
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Falha ao enviar convites: " + e.getMessage()));
        }
    }

    @PostMapping("/{id}/send")
    public ResponseEntity<?> sendDraft(@PathVariable UUID id) {
        try {
            Invitation updated = invitationService.sendDraft(id);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Falha ao enviar rascunho: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        invitationService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
