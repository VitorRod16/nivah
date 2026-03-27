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

import java.util.LinkedHashMap;
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
        String email = userDetails.getUsername();
        List<Event> events = churchAccessService.isAdmin(email)
                ? eventRepository.findAll()
                : eventRepository.findByIgrejaIdInOrIgrejaIdIsNull(churchAccessService.getAccessibleIgrejaIds(email));

        Optional<User> currentUser = userRepository.findByEmail(email);

        List<EventResponse> responses = events.stream().map(e -> {
            int count = inscriptionRepository.countByEvent(e);
            Inscription userInscription = currentUser
                    .flatMap(u -> inscriptionRepository.findByEventAndUser(e, u))
                    .orElse(null);
            boolean isCamp = "ACAMPAMENTO".equals(e.getTipoEvento());
            int inscM = isCamp ? inscriptionRepository.countByEventAndSexo(e, "MASCULINO") : 0;
            int inscF = isCamp ? inscriptionRepository.countByEventAndSexo(e, "FEMININO") : 0;
            int inscC = isCamp ? inscriptionRepository.countByEventAndTipoParticipante(e, "APOIO_CASAL") : 0;
            return EventResponse.from(e, count, userInscription, inscM, inscF, inscC);
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
    public ResponseEntity<?> inscrever(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody(required = false) Map<String, String> body) {

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

        boolean isCamp = "ACAMPAMENTO".equals(event.getTipoEvento());
        String tipoParticipante = null;
        String sexo = null;

        if (isCamp) {
            if (body == null || !body.containsKey("tipoParticipante")) {
                return ResponseEntity.badRequest().body(Map.of("error", "Tipo de participação é obrigatório para acampamentos."));
            }
            tipoParticipante = body.get("tipoParticipante");
            if (!List.of("JOVEM", "APOIO", "APOIO_CASAL").contains(tipoParticipante)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Tipo de participação inválido."));
            }

            if (!"APOIO_CASAL".equals(tipoParticipante)) {
                sexo = body.get("sexo");
                if (sexo == null || (!sexo.equals("MASCULINO") && !sexo.equals("FEMININO"))) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Sexo é obrigatório para este tipo de participação."));
                }
                if ("MASCULINO".equals(sexo) && event.getVagasMasculino() != null) {
                    int used = inscriptionRepository.countByEventAndSexo(event, "MASCULINO");
                    if (used >= event.getVagasMasculino()) {
                        return ResponseEntity.badRequest().body(Map.of("error", "Vagas masculinas esgotadas."));
                    }
                }
                if ("FEMININO".equals(sexo) && event.getVagasFeminino() != null) {
                    int used = inscriptionRepository.countByEventAndSexo(event, "FEMININO");
                    if (used >= event.getVagasFeminino()) {
                        return ResponseEntity.badRequest().body(Map.of("error", "Vagas femininas esgotadas."));
                    }
                }
            } else {
                if (event.getQuantidadeQuartos() != null) {
                    int used = inscriptionRepository.countByEventAndTipoParticipante(event, "APOIO_CASAL");
                    if (used >= event.getQuantidadeQuartos()) {
                        return ResponseEntity.badRequest().body(Map.of("error", "Quartos de casal esgotados."));
                    }
                }
            }
        } else {
            if (event.getMaxInscriptions() != null) {
                int count = inscriptionRepository.countByEvent(event);
                if (count >= event.getMaxInscriptions()) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Vagas esgotadas."));
                }
            }
        }

        Inscription inscription = Inscription.builder()
                .event(event)
                .user(user)
                .tipoParticipante(tipoParticipante)
                .sexo(sexo)
                .build();
        inscriptionRepository.save(inscription);

        int count = inscriptionRepository.countByEvent(event);
        int inscM = isCamp ? inscriptionRepository.countByEventAndSexo(event, "MASCULINO") : 0;
        int inscF = isCamp ? inscriptionRepository.countByEventAndSexo(event, "FEMININO") : 0;
        int inscC = isCamp ? inscriptionRepository.countByEventAndTipoParticipante(event, "APOIO_CASAL") : 0;
        return ResponseEntity.ok(EventResponse.from(event, count, inscription, inscM, inscF, inscC));
    }

    @DeleteMapping("/{id}/inscricoes")
    public ResponseEntity<?> desinscrever(@PathVariable UUID id, @AuthenticationPrincipal UserDetails userDetails) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Evento não encontrado."));

        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalStateException("Usuário não encontrado."));

        inscriptionRepository.findByEventAndUser(event, user)
                .ifPresent(inscriptionRepository::delete);

        boolean isCamp = "ACAMPAMENTO".equals(event.getTipoEvento());
        int count = inscriptionRepository.countByEvent(event);
        int inscM = isCamp ? inscriptionRepository.countByEventAndSexo(event, "MASCULINO") : 0;
        int inscF = isCamp ? inscriptionRepository.countByEventAndSexo(event, "FEMININO") : 0;
        int inscC = isCamp ? inscriptionRepository.countByEventAndTipoParticipante(event, "APOIO_CASAL") : 0;
        return ResponseEntity.ok(EventResponse.from(event, count, null, inscM, inscF, inscC));
    }

    @GetMapping("/{id}/inscricoes")
    public ResponseEntity<?> listarInscritos(@PathVariable UUID id) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Evento não encontrado."));

        List<Inscription> inscricoes = inscriptionRepository.findByEvent(event);
        List<Map<String, Object>> result = inscricoes.stream().map(i -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", i.getId());
            m.put("usuarioId", i.getUser().getId());
            m.put("nome", i.getUser().getName());
            m.put("email", i.getUser().getEmail());
            m.put("createdAt", i.getCreatedAt().toString());
            if (i.getTipoParticipante() != null) m.put("tipoParticipante", i.getTipoParticipante());
            if (i.getSexo() != null) m.put("sexo", i.getSexo());
            return m;
        }).toList();

        return ResponseEntity.ok(result);
    }
}
