package com.nivah.controller;

import com.nivah.dto.InvitationRequest;
import com.nivah.service.InvitationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/invitations")
@RequiredArgsConstructor
public class InvitationController {

    private final InvitationService invitationService;

    @PostMapping("/send")
    public ResponseEntity<?> send(@RequestBody InvitationRequest request) {
        try {
            int sent = invitationService.sendInvitations(request);
            return ResponseEntity.ok(Map.of("sent", sent));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Falha ao enviar convites: " + e.getMessage()));
        }
    }
}
