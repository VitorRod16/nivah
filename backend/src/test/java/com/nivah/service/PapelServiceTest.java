package com.nivah.service;

import com.nivah.dto.PapelRequest;
import com.nivah.model.*;
import com.nivah.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PapelServiceTest {

    @Mock PapelRepository papelRepository;
    @Mock IgrejaRepository igrejaRepository;
    @Mock UserRepository userRepository;

    @InjectMocks PapelService service;

    private User makeAdmin() {
        return User.builder().id(UUID.randomUUID()).email("admin@test.com").role(Role.ADMIN).build();
    }

    private User makePastor() {
        return User.builder().id(UUID.randomUUID()).email("pastor@test.com").role(Role.PASTOR).build();
    }

    private User makeMembro() {
        return User.builder().id(UUID.randomUUID()).email("m@test.com").role(Role.MEMBRO).build();
    }

    private Igreja makeIgreja(UUID id, User... pastores) {
        return Igreja.builder().id(id).nome("Igreja").pastores(new ArrayList<>(List.of(pastores))).build();
    }

    // ── findByIgreja ───────────────────────────────────────────────────────────

    @Test
    void findByIgreja_adminCanList() {
        User admin = makeAdmin();
        when(userRepository.findByEmail("admin@test.com")).thenReturn(Optional.of(admin));
        UUID igrejaId = UUID.randomUUID();
        Papel p = Papel.builder().id(UUID.randomUUID()).nome("Líder").build();
        when(papelRepository.findByIgreja_Id(igrejaId)).thenReturn(List.of(p));

        List<Papel> result = service.findByIgreja(igrejaId, "admin@test.com");

        assertThat(result).hasSize(1).contains(p);
    }

    @Test
    void findByIgreja_pastorCanListOwnIgreja() {
        User pastor = makePastor();
        when(userRepository.findByEmail("pastor@test.com")).thenReturn(Optional.of(pastor));
        UUID igrejaId = UUID.randomUUID();
        Igreja i = makeIgreja(igrejaId, pastor);
        when(igrejaRepository.findById(igrejaId)).thenReturn(Optional.of(i));
        when(papelRepository.findByIgreja_Id(igrejaId)).thenReturn(List.of());

        List<Papel> result = service.findByIgreja(igrejaId, "pastor@test.com");

        assertThat(result).isEmpty();
    }

    @Test
    void findByIgreja_pastorCannotListOtherIgreja() {
        User pastor = makePastor();
        when(userRepository.findByEmail("pastor@test.com")).thenReturn(Optional.of(pastor));
        UUID igrejaId = UUID.randomUUID();
        Igreja i = makeIgreja(igrejaId); // no pastores
        when(igrejaRepository.findById(igrejaId)).thenReturn(Optional.of(i));

        assertThatThrownBy(() -> service.findByIgreja(igrejaId, "pastor@test.com"))
                .isInstanceOf(SecurityException.class)
                .hasMessageContaining("Acesso negado");
    }

    @Test
    void findByIgreja_membroIsBlocked() {
        User membro = makeMembro();
        when(userRepository.findByEmail("m@test.com")).thenReturn(Optional.of(membro));
        UUID igrejaId = UUID.randomUUID();
        Igreja i = makeIgreja(igrejaId); // membro is not a pastor
        when(igrejaRepository.findById(igrejaId)).thenReturn(Optional.of(i));

        assertThatThrownBy(() -> service.findByIgreja(igrejaId, "m@test.com"))
                .isInstanceOf(SecurityException.class);
    }

    // ── create ─────────────────────────────────────────────────────────────────

    @Test
    void create_adminCanCreatePapel() {
        User admin = makeAdmin();
        when(userRepository.findByEmail("admin@test.com")).thenReturn(Optional.of(admin));
        UUID igrejaId = UUID.randomUUID();
        Igreja i = makeIgreja(igrejaId);
        when(igrejaRepository.findById(igrejaId)).thenReturn(Optional.of(i));
        when(papelRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        PapelRequest req = new PapelRequest();
        req.setNome("Tesoureiro");

        Papel result = service.create(igrejaId, req, "admin@test.com");

        assertThat(result.getNome()).isEqualTo("Tesoureiro");
        assertThat(result.getIgreja()).isEqualTo(i);
    }

    @Test
    void create_pastorCanCreateForOwnIgreja() {
        User pastor = makePastor();
        when(userRepository.findByEmail("pastor@test.com")).thenReturn(Optional.of(pastor));
        UUID igrejaId = UUID.randomUUID();
        Igreja i = makeIgreja(igrejaId, pastor);
        when(igrejaRepository.findById(igrejaId)).thenReturn(Optional.of(i));
        when(papelRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        PapelRequest req = new PapelRequest();
        req.setNome("Diácono");

        Papel result = service.create(igrejaId, req, "pastor@test.com");

        assertThat(result.getNome()).isEqualTo("Diácono");
    }

    @Test
    void create_pastorCannotCreateForOtherIgreja() {
        User pastor = makePastor();
        when(userRepository.findByEmail("pastor@test.com")).thenReturn(Optional.of(pastor));
        UUID igrejaId = UUID.randomUUID();
        Igreja i = makeIgreja(igrejaId); // pastor not in this church
        when(igrejaRepository.findById(igrejaId)).thenReturn(Optional.of(i));

        PapelRequest req = new PapelRequest();
        req.setNome("Diácono");

        assertThatThrownBy(() -> service.create(igrejaId, req, "pastor@test.com"))
                .isInstanceOf(SecurityException.class);
    }

    // ── delete ─────────────────────────────────────────────────────────────────

    @Test
    void delete_adminCanDelete() {
        User admin = makeAdmin();
        when(userRepository.findByEmail("admin@test.com")).thenReturn(Optional.of(admin));
        UUID igrejaId = UUID.randomUUID();
        UUID papelId = UUID.randomUUID();

        service.delete(igrejaId, papelId, "admin@test.com");

        verify(papelRepository).deleteById(papelId);
    }

    @Test
    void delete_pastorCanDeleteFromOwnIgreja() {
        User pastor = makePastor();
        when(userRepository.findByEmail("pastor@test.com")).thenReturn(Optional.of(pastor));
        UUID igrejaId = UUID.randomUUID();
        Igreja i = makeIgreja(igrejaId, pastor);
        when(igrejaRepository.findById(igrejaId)).thenReturn(Optional.of(i));
        UUID papelId = UUID.randomUUID();

        service.delete(igrejaId, papelId, "pastor@test.com");

        verify(papelRepository).deleteById(papelId);
    }

    @Test
    void delete_membroCannotDelete() {
        User membro = makeMembro();
        when(userRepository.findByEmail("m@test.com")).thenReturn(Optional.of(membro));
        UUID igrejaId = UUID.randomUUID();
        Igreja i = makeIgreja(igrejaId);
        when(igrejaRepository.findById(igrejaId)).thenReturn(Optional.of(i));

        assertThatThrownBy(() -> service.delete(igrejaId, UUID.randomUUID(), "m@test.com"))
                .isInstanceOf(SecurityException.class);
        verify(papelRepository, never()).deleteById(any());
    }
}
