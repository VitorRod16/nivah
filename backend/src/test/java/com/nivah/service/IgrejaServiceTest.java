package com.nivah.service;

import com.nivah.dto.IgrejaRequest;
import com.nivah.model.Igreja;
import com.nivah.model.Role;
import com.nivah.model.User;
import com.nivah.repository.IgrejaRepository;
import com.nivah.repository.UserRepository;
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
class IgrejaServiceTest {

    @Mock IgrejaRepository igrejaRepository;
    @Mock UserRepository userRepository;

    @InjectMocks IgrejaService service;

    private User admin() {
        return User.builder().id(UUID.randomUUID()).email("admin@test.com").role(Role.ADMIN).build();
    }

    private User pastor() {
        return User.builder().id(UUID.randomUUID()).email("pastor@test.com").role(Role.PASTOR).build();
    }

    private User membro() {
        return User.builder().id(UUID.randomUUID()).email("m@test.com").role(Role.MEMBRO).build();
    }

    // ── findAll ───────────────────────────────────────────────────────────────

    @Test
    void findAll_adminReturnsAllIgrejas() {
        User admin = admin();
        when(userRepository.findByEmail("admin@test.com")).thenReturn(Optional.of(admin));
        Igreja i1 = Igreja.builder().id(UUID.randomUUID()).nome("A").build();
        Igreja i2 = Igreja.builder().id(UUID.randomUUID()).nome("B").build();
        when(igrejaRepository.findAll()).thenReturn(List.of(i1, i2));

        List<Igreja> result = service.findAll("admin@test.com");

        assertThat(result).hasSize(2);
    }

    @Test
    void findAll_pastorReturnsOnlyOwnIgrejas() {
        User pastor = pastor();
        when(userRepository.findByEmail("pastor@test.com")).thenReturn(Optional.of(pastor));
        Igreja i1 = Igreja.builder().id(UUID.randomUUID()).nome("Minha").build();
        when(igrejaRepository.findByPastoresContaining(pastor)).thenReturn(List.of(i1));

        List<Igreja> result = service.findAll("pastor@test.com");

        assertThat(result).hasSize(1);
        verify(igrejaRepository, never()).findAll();
    }

    // ── findById ─────────────────────────────────────────────────────────────

    @Test
    void findById_adminCanAccessAnyIgreja() {
        User admin = admin();
        when(userRepository.findByEmail("admin@test.com")).thenReturn(Optional.of(admin));
        UUID id = UUID.randomUUID();
        Igreja i = Igreja.builder().id(id).nome("Qualquer").build();
        when(igrejaRepository.findById(id)).thenReturn(Optional.of(i));

        Igreja result = service.findById(id, "admin@test.com");

        assertThat(result.getId()).isEqualTo(id);
    }

    @Test
    void findById_pastorCanAccessOwnIgreja() {
        User pastor = pastor();
        when(userRepository.findByEmail("pastor@test.com")).thenReturn(Optional.of(pastor));
        UUID id = UUID.randomUUID();
        Igreja i = Igreja.builder().id(id).nome("Minha").pastores(new ArrayList<>(List.of(pastor))).build();
        when(igrejaRepository.findById(id)).thenReturn(Optional.of(i));

        Igreja result = service.findById(id, "pastor@test.com");

        assertThat(result).isEqualTo(i);
    }

    @Test
    void findById_pastorCannotAccessOtherIgreja() {
        User pastor = pastor();
        when(userRepository.findByEmail("pastor@test.com")).thenReturn(Optional.of(pastor));
        UUID id = UUID.randomUUID();
        Igreja i = Igreja.builder().id(id).nome("Outra").build();
        when(igrejaRepository.findById(id)).thenReturn(Optional.of(i));

        assertThatThrownBy(() -> service.findById(id, "pastor@test.com"))
                .isInstanceOf(SecurityException.class)
                .hasMessageContaining("Acesso negado");
    }

    @Test
    void findById_throwsWhenIgrejaNotFound() {
        UUID id = UUID.randomUUID();
        when(igrejaRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.findById(id, "admin@test.com"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Igreja não encontrada");
    }

    // ── create ────────────────────────────────────────────────────────────────

    @Test
    void create_adminCreatesIgrejaWithoutAddingPastor() {
        User admin = admin();
        when(userRepository.findByEmail("admin@test.com")).thenReturn(Optional.of(admin));
        when(igrejaRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        IgrejaRequest req = new IgrejaRequest();
        req.setNome("Nova Igreja");
        req.setCidade("Brasília");

        Igreja result = service.create(req, "admin@test.com");

        assertThat(result.getNome()).isEqualTo("Nova Igreja");
        assertThat(result.getPastores()).isEmpty();
    }

    @Test
    void create_pastorAddsHimselfToPastores() {
        User pastor = pastor();
        when(userRepository.findByEmail("pastor@test.com")).thenReturn(Optional.of(pastor));
        when(igrejaRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        IgrejaRequest req = new IgrejaRequest();
        req.setNome("Igreja do Pastor");

        Igreja result = service.create(req, "pastor@test.com");

        assertThat(result.getPastores()).contains(pastor);
    }

    // ── update ────────────────────────────────────────────────────────────────

    @Test
    void update_adminCanUpdateAnyIgreja() {
        User admin = admin();
        when(userRepository.findByEmail("admin@test.com")).thenReturn(Optional.of(admin));
        UUID id = UUID.randomUUID();
        Igreja existing = Igreja.builder().id(id).nome("Velha").build();
        when(igrejaRepository.findById(id)).thenReturn(Optional.of(existing));
        when(igrejaRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        IgrejaRequest req = new IgrejaRequest();
        req.setNome("Nova");

        Igreja result = service.update(id, req, "admin@test.com");

        assertThat(result.getNome()).isEqualTo("Nova");
    }

    @Test
    void update_pastorCannotUpdateOtherIgreja() {
        User pastor = pastor();
        when(userRepository.findByEmail("pastor@test.com")).thenReturn(Optional.of(pastor));
        UUID id = UUID.randomUUID();
        Igreja existing = Igreja.builder().id(id).nome("Outra").build();
        when(igrejaRepository.findById(id)).thenReturn(Optional.of(existing));

        IgrejaRequest req = new IgrejaRequest();
        req.setNome("Tentativa");

        assertThatThrownBy(() -> service.update(id, req, "pastor@test.com"))
                .isInstanceOf(SecurityException.class);
    }

    // ── delete ────────────────────────────────────────────────────────────────

    @Test
    void delete_adminCanDelete() {
        User admin = admin();
        when(userRepository.findByEmail("admin@test.com")).thenReturn(Optional.of(admin));
        UUID id = UUID.randomUUID();

        service.delete(id, "admin@test.com");

        verify(igrejaRepository).deleteById(id);
    }

    @Test
    void delete_pastorCannotDelete() {
        User pastor = pastor();
        when(userRepository.findByEmail("pastor@test.com")).thenReturn(Optional.of(pastor));

        assertThatThrownBy(() -> service.delete(UUID.randomUUID(), "pastor@test.com"))
                .isInstanceOf(SecurityException.class)
                .hasMessageContaining("administradores");
    }

    // ── addPastor / removePastor ───────────────────────────────────────────────

    @Test
    void addPastor_adminCanAddPastor() {
        User admin = admin();
        when(userRepository.findByEmail("admin@test.com")).thenReturn(Optional.of(admin));

        UUID igrejaId = UUID.randomUUID();
        UUID pastorId = UUID.randomUUID();
        Igreja i = Igreja.builder().id(igrejaId).nome("I").build();
        User novoPastor = User.builder().id(pastorId).role(Role.MEMBRO).build();

        when(igrejaRepository.findById(igrejaId)).thenReturn(Optional.of(i));
        when(userRepository.findById(pastorId)).thenReturn(Optional.of(novoPastor));
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(igrejaRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Igreja result = service.addPastor(igrejaId, pastorId, "admin@test.com");

        assertThat(result.getPastores()).contains(novoPastor);
        assertThat(novoPastor.getRole()).isEqualTo(Role.PASTOR);
    }

    @Test
    void addPastor_nonAdminCannotAddPastor() {
        User pastor = pastor();
        when(userRepository.findByEmail("pastor@test.com")).thenReturn(Optional.of(pastor));

        assertThatThrownBy(() -> service.addPastor(UUID.randomUUID(), UUID.randomUUID(), "pastor@test.com"))
                .isInstanceOf(SecurityException.class)
                .hasMessageContaining("administradores");
    }

    @Test
    void removePastor_adminCanRemovePastor() {
        User admin = admin();
        when(userRepository.findByEmail("admin@test.com")).thenReturn(Optional.of(admin));

        UUID igrejaId = UUID.randomUUID();
        UUID pastorId = UUID.randomUUID();
        User pastor = User.builder().id(pastorId).role(Role.PASTOR).build();
        Igreja i = Igreja.builder().id(igrejaId).nome("I").pastores(new ArrayList<>(List.of(pastor))).build();

        when(igrejaRepository.findById(igrejaId)).thenReturn(Optional.of(i));
        when(igrejaRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Igreja result = service.removePastor(igrejaId, pastorId, "admin@test.com");

        assertThat(result.getPastores()).isEmpty();
    }
}
