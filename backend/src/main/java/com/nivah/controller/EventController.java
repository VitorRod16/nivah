package com.nivah.controller;

import com.nivah.dto.EventResponse;
import com.nivah.model.Event;
import com.nivah.model.Inscription;
import com.nivah.model.User;
import com.nivah.repository.EventRepository;
import com.nivah.repository.InscriptionRepository;
import com.nivah.repository.UserRepository;
import com.nivah.service.ChurchAccessService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {

    private final EventRepository eventRepository;
    private final InscriptionRepository inscriptionRepository;
    private final UserRepository userRepository;
    private final ChurchAccessService churchAccessService;

    @GetMapping
    public ResponseEntity<List<EventResponse>> getAll(@AuthenticationPrincipal UserDetails userDetails) {
        List<java.util.UUID> igrejaIds = churchAccessService.getAccessibleIgrejaIds(userDetails.getUsername());
        List<Event> events = eventRepository.findByIgrejaIdIn(igrejaIds);
        Optional<User> currentUser = userDetails != null
                ? userRepository.findByEmail(userDetails.getUsername())
                : Optional.empty();

        List<EventResponse> responses = events.stream().map(e -> {
            int count = inscriptionRepository.countByEvent(e);
            boolean userInscrito = currentUser
                    .map(u -> inscriptionRepository.existsByEventAndUser(e, u))
                    .orElse(false);
            return EventResponse.from(e, count, userInscrito);
        }).toList();

        return ResponseEntity.ok(responses);
    }

    @PostMapping
    public ResponseEntity<Event> create(@RequestBody Event event) {
        return ResponseEntity.ok(eventRepository.save(event));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Event> update(@PathVariable UUID id, @RequestBody Event event) {
        if (!eventRepository.existsById(id)) return ResponseEntity.notFound().build();
        event.setId(id);
        return ResponseEntity.ok(eventRepository.save(event));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        if (!eventRepository.existsById(id)) return ResponseEntity.notFound().build();
        eventRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // — Inscrições —

    @PostMapping("/{id}/inscricoes")
    public ResponseEntity<?> inscrever(@PathVariable UUID id, @AuthenticationPrincipal UserDetails userDetails) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Evento não encontrado."));

        if (!event.isAllowInscriptions()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Este evento não aceita inscrições."));
        }

        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalStateException("Usuário não encontrado."));

        if (inscriptionRepository.existsByEventAndUser(event, user)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Você já está inscrito neste evento."));
        }

        if (event.getMaxInscriptions() != null) {
            int count = inscriptionRepository.countByEvent(event);
            if (count >= event.getMaxInscriptions()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Vagas esgotadas."));
            }
        }

        inscriptionRepository.save(Inscription.builder().event(event).user(user).build());

        int count = inscriptionRepository.countByEvent(event);
        return ResponseEntity.ok(EventResponse.from(event, count, true));
    }

    @DeleteMapping("/{id}/inscricoes")
    public ResponseEntity<?> desinscrever(@PathVariable UUID id, @AuthenticationPrincipal UserDetails userDetails) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Evento não encontrado."));

        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalStateException("Usuário não encontrado."));

        inscriptionRepository.findByEventAndUser(event, user)
                .ifPresent(inscriptionRepository::delete);

        int count = inscriptionRepository.countByEvent(event);
        return ResponseEntity.ok(EventResponse.from(event, count, false));
    }

    @GetMapping("/{id}/inscricoes")
    public ResponseEntity<?> listarInscritos(@PathVariable UUID id) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Evento não encontrado."));

        List<Inscription> inscricoes = inscriptionRepository.findByEvent(event);
        List<Map<String, Object>> result = inscricoes.stream().map(i -> Map.<String, Object>of(
                "id", i.getId(),
                "usuarioId", i.getUser().getId(),
                "nome", i.getUser().getName(),
                "email", i.getUser().getEmail(),
                "createdAt", i.getCreatedAt().toString()
        )).toList();

        return ResponseEntity.ok(result);
    }
}
