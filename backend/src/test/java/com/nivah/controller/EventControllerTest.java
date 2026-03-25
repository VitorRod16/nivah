package com.nivah.controller;

import com.nivah.model.Event;
import com.nivah.model.Inscription;
import com.nivah.model.Role;
import com.nivah.model.User;
import com.nivah.repository.EventRepository;
import com.nivah.repository.InscriptionRepository;
import com.nivah.repository.UserRepository;
import com.nivah.service.ChurchAccessService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class EventControllerTest {

    @Mock EventRepository eventRepository;
    @Mock InscriptionRepository inscriptionRepository;
    @Mock UserRepository userRepository;
    @Mock ChurchAccessService churchAccessService;

    @InjectMocks EventController controller;

    private UserDetails mockUserDetails(String email) {
        UserDetails ud = mock(UserDetails.class);
        when(ud.getUsername()).thenReturn(email);
        return ud;
    }

    private User makeUser(String email) {
        return User.builder().id(UUID.randomUUID()).name("User").email(email).role(Role.MEMBRO).build();
    }

    private Event makeEvent(boolean allowInscriptions, String tipoEvento) {
        return Event.builder()
                .id(UUID.randomUUID())
                .title("Evento Teste")
                .date("2026-04-01")
                .allowInscriptions(allowInscriptions)
                .tipoEvento(tipoEvento)
                .build();
    }

    // ── create ────────────────────────────────────────────────────────────────

    @Test
    void create_savesAndReturnsEvent() {
        Event event = makeEvent(false, "NORMAL");
        when(eventRepository.save(event)).thenReturn(event);

        ResponseEntity<Event> response = controller.create(event);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isEqualTo(event);
    }

    // ── update ────────────────────────────────────────────────────────────────

    @Test
    void update_returns200WhenEventExists() {
        UUID id = UUID.randomUUID();
        Event event = makeEvent(false, "NORMAL");
        when(eventRepository.existsById(id)).thenReturn(true);
        when(eventRepository.save(any())).thenReturn(event);

        ResponseEntity<Event> response = controller.update(id, event);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
    }

    @Test
    void update_returns404WhenEventNotFound() {
        UUID id = UUID.randomUUID();
        when(eventRepository.existsById(id)).thenReturn(false);

        ResponseEntity<Event> response = controller.update(id, makeEvent(false, "NORMAL"));

        assertThat(response.getStatusCode().value()).isEqualTo(404);
    }

    // ── delete ────────────────────────────────────────────────────────────────

    @Test
    void delete_returns204WhenEventExists() {
        UUID id = UUID.randomUUID();
        when(eventRepository.existsById(id)).thenReturn(true);

        ResponseEntity<Void> response = controller.delete(id);

        assertThat(response.getStatusCode().value()).isEqualTo(204);
        verify(eventRepository).deleteById(id);
    }

    @Test
    void delete_returns404WhenEventNotFound() {
        UUID id = UUID.randomUUID();
        when(eventRepository.existsById(id)).thenReturn(false);

        ResponseEntity<Void> response = controller.delete(id);

        assertThat(response.getStatusCode().value()).isEqualTo(404);
        verify(eventRepository, never()).deleteById(any());
    }

    // ── inscrever — evento normal ─────────────────────────────────────────────

    @Test
    void inscrever_returns400WhenInscricoesNotAllowed() {
        UUID id = UUID.randomUUID();
        Event event = makeEvent(false, "NORMAL");
        when(eventRepository.findById(id)).thenReturn(Optional.of(event));

        UserDetails ud = mockUserDetails("u@test.com");
        ResponseEntity<?> response = controller.inscrever(id, ud, null);

        assertThat(response.getStatusCode().value()).isEqualTo(400);
        assertThat(response.getBody().toString()).contains("não aceita inscrições");
    }

    @Test
    void inscrever_returns400WhenAlreadyInscribed() {
        UUID id = UUID.randomUUID();
        Event event = makeEvent(true, "NORMAL");
        when(eventRepository.findById(id)).thenReturn(Optional.of(event));

        User user = makeUser("u@test.com");
        when(userRepository.findByEmail("u@test.com")).thenReturn(Optional.of(user));
        when(inscriptionRepository.existsByEventAndUser(event, user)).thenReturn(true);

        UserDetails ud = mockUserDetails("u@test.com");
        ResponseEntity<?> response = controller.inscrever(id, ud, null);

        assertThat(response.getStatusCode().value()).isEqualTo(400);
        assertThat(response.getBody().toString()).contains("já está inscrito");
    }

    @Test
    void inscrever_normalEventWithinVagasSucceeds() {
        UUID id = UUID.randomUUID();
        Event event = Event.builder().id(id).title("Normal").date("2026-04-01")
                .allowInscriptions(true).tipoEvento("NORMAL").maxInscriptions(10).build();
        when(eventRepository.findById(id)).thenReturn(Optional.of(event));

        User user = makeUser("u@test.com");
        when(userRepository.findByEmail("u@test.com")).thenReturn(Optional.of(user));
        when(inscriptionRepository.existsByEventAndUser(event, user)).thenReturn(false);
        when(inscriptionRepository.countByEvent(event)).thenReturn(5);
        when(inscriptionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UserDetails ud = mockUserDetails("u@test.com");
        ResponseEntity<?> response = controller.inscrever(id, ud, null);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
    }

    @Test
    void inscrever_normalEventReturns400WhenVagasEsgotadas() {
        UUID id = UUID.randomUUID();
        Event event = Event.builder().id(id).title("Cheio").date("2026-04-01")
                .allowInscriptions(true).tipoEvento("NORMAL").maxInscriptions(5).build();
        when(eventRepository.findById(id)).thenReturn(Optional.of(event));

        User user = makeUser("u@test.com");
        when(userRepository.findByEmail("u@test.com")).thenReturn(Optional.of(user));
        when(inscriptionRepository.existsByEventAndUser(event, user)).thenReturn(false);
        when(inscriptionRepository.countByEvent(event)).thenReturn(5);

        UserDetails ud = mockUserDetails("u@test.com");
        ResponseEntity<?> response = controller.inscrever(id, ud, null);

        assertThat(response.getStatusCode().value()).isEqualTo(400);
        assertThat(response.getBody().toString()).contains("Vagas esgotadas");
    }

    // ── inscrever — acampamento ──────────────────────────────────────────────

    @Test
    void inscrever_campRequiresTipoParticipante() {
        UUID id = UUID.randomUUID();
        Event camp = makeEvent(true, "ACAMPAMENTO");
        when(eventRepository.findById(id)).thenReturn(Optional.of(camp));
        User user = makeUser("u@test.com");
        when(userRepository.findByEmail("u@test.com")).thenReturn(Optional.of(user));
        when(inscriptionRepository.existsByEventAndUser(camp, user)).thenReturn(false);

        UserDetails ud = mockUserDetails("u@test.com");
        ResponseEntity<?> response = controller.inscrever(id, ud, null); // no body

        assertThat(response.getStatusCode().value()).isEqualTo(400);
        assertThat(response.getBody().toString()).contains("Tipo de participação é obrigatório");
    }

    @Test
    void inscrever_campRejectsInvalidTipoParticipante() {
        UUID id = UUID.randomUUID();
        Event camp = makeEvent(true, "ACAMPAMENTO");
        when(eventRepository.findById(id)).thenReturn(Optional.of(camp));
        User user = makeUser("u@test.com");
        when(userRepository.findByEmail("u@test.com")).thenReturn(Optional.of(user));
        when(inscriptionRepository.existsByEventAndUser(camp, user)).thenReturn(false);

        UserDetails ud = mockUserDetails("u@test.com");
        Map<String, String> body = Map.of("tipoParticipante", "INVALIDO");
        ResponseEntity<?> response = controller.inscrever(id, ud, body);

        assertThat(response.getStatusCode().value()).isEqualTo(400);
        assertThat(response.getBody().toString()).contains("inválido");
    }

    @Test
    void inscrever_campJovemRequiresSexo() {
        UUID id = UUID.randomUUID();
        Event camp = makeEvent(true, "ACAMPAMENTO");
        when(eventRepository.findById(id)).thenReturn(Optional.of(camp));
        User user = makeUser("u@test.com");
        when(userRepository.findByEmail("u@test.com")).thenReturn(Optional.of(user));
        when(inscriptionRepository.existsByEventAndUser(camp, user)).thenReturn(false);

        UserDetails ud = mockUserDetails("u@test.com");
        Map<String, String> body = Map.of("tipoParticipante", "JOVEM"); // no sexo
        ResponseEntity<?> response = controller.inscrever(id, ud, body);

        assertThat(response.getStatusCode().value()).isEqualTo(400);
        assertThat(response.getBody().toString()).contains("Sexo é obrigatório");
    }

    @Test
    void inscrever_campMasculinoVagasEsgotadas() {
        UUID id = UUID.randomUUID();
        Event camp = Event.builder().id(id).title("Camp").date("2026-04-01")
                .allowInscriptions(true).tipoEvento("ACAMPAMENTO").vagasMasculino(10).build();
        when(eventRepository.findById(id)).thenReturn(Optional.of(camp));
        User user = makeUser("u@test.com");
        when(userRepository.findByEmail("u@test.com")).thenReturn(Optional.of(user));
        when(inscriptionRepository.existsByEventAndUser(camp, user)).thenReturn(false);
        when(inscriptionRepository.countByEventAndSexo(camp, "MASCULINO")).thenReturn(10);

        UserDetails ud = mockUserDetails("u@test.com");
        Map<String, String> body = new HashMap<>();
        body.put("tipoParticipante", "JOVEM");
        body.put("sexo", "MASCULINO");

        ResponseEntity<?> response = controller.inscrever(id, ud, body);

        assertThat(response.getStatusCode().value()).isEqualTo(400);
        assertThat(response.getBody().toString()).contains("masculinas esgotadas");
    }

    @Test
    void inscrever_campFemininoVagasEsgotadas() {
        UUID id = UUID.randomUUID();
        Event camp = Event.builder().id(id).title("Camp").date("2026-04-01")
                .allowInscriptions(true).tipoEvento("ACAMPAMENTO").vagasFeminino(5).build();
        when(eventRepository.findById(id)).thenReturn(Optional.of(camp));
        User user = makeUser("u@test.com");
        when(userRepository.findByEmail("u@test.com")).thenReturn(Optional.of(user));
        when(inscriptionRepository.existsByEventAndUser(camp, user)).thenReturn(false);
        when(inscriptionRepository.countByEventAndSexo(camp, "FEMININO")).thenReturn(5);

        UserDetails ud = mockUserDetails("u@test.com");
        Map<String, String> body = new HashMap<>();
        body.put("tipoParticipante", "APOIO");
        body.put("sexo", "FEMININO");

        ResponseEntity<?> response = controller.inscrever(id, ud, body);

        assertThat(response.getStatusCode().value()).isEqualTo(400);
        assertThat(response.getBody().toString()).contains("femininas esgotadas");
    }

    @Test
    void inscrever_campApoioCasalQuartosEsgotados() {
        UUID id = UUID.randomUUID();
        Event camp = Event.builder().id(id).title("Camp").date("2026-04-01")
                .allowInscriptions(true).tipoEvento("ACAMPAMENTO").quantidadeQuartos(3).build();
        when(eventRepository.findById(id)).thenReturn(Optional.of(camp));
        User user = makeUser("u@test.com");
        when(userRepository.findByEmail("u@test.com")).thenReturn(Optional.of(user));
        when(inscriptionRepository.existsByEventAndUser(camp, user)).thenReturn(false);
        when(inscriptionRepository.countByEventAndTipoParticipante(camp, "APOIO_CASAL")).thenReturn(3);

        UserDetails ud = mockUserDetails("u@test.com");
        Map<String, String> body = Map.of("tipoParticipante", "APOIO_CASAL");
        ResponseEntity<?> response = controller.inscrever(id, ud, body);

        assertThat(response.getStatusCode().value()).isEqualTo(400);
        assertThat(response.getBody().toString()).contains("Quartos de casal esgotados");
    }

    @Test
    void inscrever_campApoioCasalSucceeds() {
        UUID id = UUID.randomUUID();
        Event camp = Event.builder().id(id).title("Camp").date("2026-04-01")
                .allowInscriptions(true).tipoEvento("ACAMPAMENTO").quantidadeQuartos(5).build();
        when(eventRepository.findById(id)).thenReturn(Optional.of(camp));
        User user = makeUser("u@test.com");
        when(userRepository.findByEmail("u@test.com")).thenReturn(Optional.of(user));
        when(inscriptionRepository.existsByEventAndUser(camp, user)).thenReturn(false);
        when(inscriptionRepository.countByEventAndTipoParticipante(camp, "APOIO_CASAL")).thenReturn(2);
        when(inscriptionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(inscriptionRepository.countByEvent(any())).thenReturn(3);
        when(inscriptionRepository.countByEventAndSexo(any(), any())).thenReturn(0);

        UserDetails ud = mockUserDetails("u@test.com");
        Map<String, String> body = Map.of("tipoParticipante", "APOIO_CASAL");
        ResponseEntity<?> response = controller.inscrever(id, ud, body);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
    }

    // ── desinscrever ─────────────────────────────────────────────────────────

    @Test
    void desinscrever_removesInscriptionAndReturnsEvent() {
        UUID id = UUID.randomUUID();
        Event event = makeEvent(true, "NORMAL");
        when(eventRepository.findById(id)).thenReturn(Optional.of(event));
        User user = makeUser("u@test.com");
        when(userRepository.findByEmail("u@test.com")).thenReturn(Optional.of(user));
        Inscription inscription = Inscription.builder().id(UUID.randomUUID()).event(event).user(user).build();
        when(inscriptionRepository.findByEventAndUser(event, user)).thenReturn(Optional.of(inscription));
        when(inscriptionRepository.countByEvent(any())).thenReturn(0);

        UserDetails ud = mockUserDetails("u@test.com");
        ResponseEntity<?> response = controller.desinscrever(id, ud);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        verify(inscriptionRepository).delete(inscription);
    }

    @Test
    void desinscrever_returnsOkEvenIfNotInscribed() {
        UUID id = UUID.randomUUID();
        Event event = makeEvent(true, "NORMAL");
        when(eventRepository.findById(id)).thenReturn(Optional.of(event));
        User user = makeUser("u@test.com");
        when(userRepository.findByEmail("u@test.com")).thenReturn(Optional.of(user));
        when(inscriptionRepository.findByEventAndUser(event, user)).thenReturn(Optional.empty());
        when(inscriptionRepository.countByEvent(any())).thenReturn(0);

        UserDetails ud = mockUserDetails("u@test.com");
        ResponseEntity<?> response = controller.desinscrever(id, ud);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        verify(inscriptionRepository, never()).delete(any(Inscription.class));
    }
}
