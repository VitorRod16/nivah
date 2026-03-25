package com.nivah.service;

import com.nivah.dto.MembroIgrejaRequest;
import com.nivah.dto.MembroIgrejaResponse;
import com.nivah.model.*;
import com.nivah.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MembroIgrejaServiceTest {

    @Mock MembroIgrejaRepository membroIgrejaRepository;
    @Mock IgrejaRepository igrejaRepository;
    @Mock PapelRepository papelRepository;
    @Mock UserRepository userRepository;
    @Mock PasswordEncoder passwordEncoder;

    @InjectMocks MembroIgrejaService service;

    private User makeAdmin() {
        return User.builder().id(UUID.randomUUID()).name("Admin").email("admin@test.com").role(Role.ADMIN).build();
    }

    private User makePastor() {
        return User.builder().id(UUID.randomUUID()).name("Pastor").email("pastor@test.com").role(Role.PASTOR).build();
    }

    private User makeMembro() {
        return User.builder().id(UUID.randomUUID()).name("Membro").email("m@test.com").role(Role.MEMBRO).build();
    }

    private Igreja makeIgreja(UUID id, User... pastores) {
        return Igreja.builder().id(id).nome("Igreja").pastores(new ArrayList<>(List.of(pastores))).build();
    }

    private MembroIgreja makeMembroIgreja(User usuario, Igreja igreja) {
        return MembroIgreja.builder().id(UUID.randomUUID()).usuario(usuario).igreja(igreja).build();
    }

    // ── findAll ───────────────────────────────────────────────────────────────

    @Test
    void findAll_adminGetsAllMembros() {
        User admin = makeAdmin();
        when(userRepository.findByEmail("admin@test.com")).thenReturn(Optional.of(admin));
        User u = makeMembro();
        Igreja i = makeIgreja(UUID.randomUUID());
        MembroIgreja mi = makeMembroIgreja(u, i);
        when(membroIgrejaRepository.findAll()).thenReturn(List.of(mi));

        List<MembroIgrejaResponse> result = service.findAll("admin@test.com");

        assertThat(result).hasSize(1);
    }

    @Test
    void findAll_pastorGetsOnlyOwnChurchMembers() {
        User pastor = makePastor();
        when(userRepository.findByEmail("pastor@test.com")).thenReturn(Optional.of(pastor));
        UUID igrejaId = UUID.randomUUID();
        Igreja i = makeIgreja(igrejaId, pastor);
        when(igrejaRepository.findByPastoresContaining(pastor)).thenReturn(List.of(i));
        User u = makeMembro();
        MembroIgreja mi = makeMembroIgreja(u, i);
        when(membroIgrejaRepository.findByIgrejaIn(List.of(i))).thenReturn(List.of(mi));

        List<MembroIgrejaResponse> result = service.findAll("pastor@test.com");

        assertThat(result).hasSize(1);
        verify(membroIgrejaRepository, never()).findAll();
    }

    // ── add ───────────────────────────────────────────────────────────────────

    @Test
    void add_pastorAddsExistingUserToIgreja() {
        User pastor = makePastor();
        when(userRepository.findByEmail("pastor@test.com")).thenReturn(Optional.of(pastor));
        UUID igrejaId = UUID.randomUUID();
        Igreja i = makeIgreja(igrejaId, pastor);
        when(igrejaRepository.findById(igrejaId)).thenReturn(Optional.of(i));

        User existing = makeMembro();
        when(userRepository.findByEmail("m@test.com")).thenReturn(Optional.of(existing));
        when(membroIgrejaRepository.findByUsuarioAndIgreja(existing, i)).thenReturn(Optional.empty());
        when(membroIgrejaRepository.save(any())).thenAnswer(inv -> {
            MembroIgreja mi = inv.getArgument(0);
            mi = MembroIgreja.builder().id(UUID.randomUUID()).usuario(mi.getUsuario())
                    .igreja(mi.getIgreja()).phone(mi.getPhone()).build();
            return mi;
        });

        MembroIgrejaRequest req = new MembroIgrejaRequest();
        req.setEmail("m@test.com");
        req.setIgrejaId(igrejaId);

        MembroIgrejaResponse result = service.add(req, "pastor@test.com");

        assertThat(result.getIgrejaId()).isEqualTo(igrejaId);
    }

    @Test
    void add_createsNewUserWhenEmailDoesNotExist() {
        User pastor = makePastor();
        when(userRepository.findByEmail("pastor@test.com")).thenReturn(Optional.of(pastor));
        UUID igrejaId = UUID.randomUUID();
        Igreja i = makeIgreja(igrejaId, pastor);
        when(igrejaRepository.findById(igrejaId)).thenReturn(Optional.of(i));
        when(userRepository.findByEmail("novo@test.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode(any())).thenReturn("enc");
        User novo = User.builder().id(UUID.randomUUID()).name("Novo").email("novo@test.com").role(Role.MEMBRO).build();
        when(userRepository.save(any(User.class))).thenReturn(novo);
        when(membroIgrejaRepository.findByUsuarioAndIgreja(novo, i)).thenReturn(Optional.empty());
        when(membroIgrejaRepository.save(any())).thenAnswer(inv -> {
            MembroIgreja mi = inv.getArgument(0);
            return MembroIgreja.builder().id(UUID.randomUUID()).usuario(mi.getUsuario()).igreja(mi.getIgreja()).build();
        });

        MembroIgrejaRequest req = new MembroIgrejaRequest();
        req.setEmail("novo@test.com");
        req.setName("Novo");
        req.setIgrejaId(igrejaId);

        MembroIgrejaResponse result = service.add(req, "pastor@test.com");

        assertThat(result).isNotNull();
        verify(userRepository).save(any(User.class));
    }

    @Test
    void add_throwsWhenNewUserHasNoName() {
        User pastor = makePastor();
        when(userRepository.findByEmail("pastor@test.com")).thenReturn(Optional.of(pastor));
        UUID igrejaId = UUID.randomUUID();
        Igreja i = makeIgreja(igrejaId, pastor);
        when(igrejaRepository.findById(igrejaId)).thenReturn(Optional.of(i));
        when(userRepository.findByEmail("novo@test.com")).thenReturn(Optional.empty());

        MembroIgrejaRequest req = new MembroIgrejaRequest();
        req.setEmail("novo@test.com");
        req.setIgrejaId(igrejaId);
        // name is null

        assertThatThrownBy(() -> service.add(req, "pastor@test.com"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Nome é obrigatório");
    }

    @Test
    void add_throwsWhenUserAlreadyMember() {
        User pastor = makePastor();
        when(userRepository.findByEmail("pastor@test.com")).thenReturn(Optional.of(pastor));
        UUID igrejaId = UUID.randomUUID();
        Igreja i = makeIgreja(igrejaId, pastor);
        when(igrejaRepository.findById(igrejaId)).thenReturn(Optional.of(i));
        User existing = makeMembro();
        when(userRepository.findByEmail("m@test.com")).thenReturn(Optional.of(existing));
        MembroIgreja mi = makeMembroIgreja(existing, i);
        when(membroIgrejaRepository.findByUsuarioAndIgreja(existing, i)).thenReturn(Optional.of(mi));

        MembroIgrejaRequest req = new MembroIgrejaRequest();
        req.setEmail("m@test.com");
        req.setIgrejaId(igrejaId);

        assertThatThrownBy(() -> service.add(req, "pastor@test.com"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("já é membro");
    }

    @Test
    void add_throwsForMembroRole() {
        User membro = makeMembro();
        when(userRepository.findByEmail("m@test.com")).thenReturn(Optional.of(membro));
        UUID igrejaId = UUID.randomUUID();

        MembroIgrejaRequest req = new MembroIgrejaRequest();
        req.setEmail("outro@test.com");
        req.setIgrejaId(igrejaId);

        assertThatThrownBy(() -> service.add(req, "m@test.com"))
                .isInstanceOf(SecurityException.class)
                .hasMessageContaining("Acesso negado");
    }

    // ── delete ────────────────────────────────────────────────────────────────

    @Test
    void delete_adminCanDelete() {
        User admin = makeAdmin();
        when(userRepository.findByEmail("admin@test.com")).thenReturn(Optional.of(admin));
        UUID membroId = UUID.randomUUID();
        UUID igrejaId = UUID.randomUUID();
        Igreja i = makeIgreja(igrejaId);
        User u = makeMembro();
        MembroIgreja mi = MembroIgreja.builder().id(membroId).usuario(u).igreja(i).build();
        when(membroIgrejaRepository.findById(membroId)).thenReturn(Optional.of(mi));

        service.delete(membroId, "admin@test.com");

        verify(membroIgrejaRepository).deleteById(membroId);
    }

    @Test
    void delete_throwsWhenNotFound() {
        UUID id = UUID.randomUUID();
        when(membroIgrejaRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.delete(id, "admin@test.com"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("não encontrado");
    }

    // ── addPapel / removePapel ────────────────────────────────────────────────

    @Test
    void addPapel_adminCanAddPapel() {
        User admin = makeAdmin();
        when(userRepository.findByEmail("admin@test.com")).thenReturn(Optional.of(admin));
        UUID membroId = UUID.randomUUID();
        UUID igrejaId = UUID.randomUUID();
        Igreja i = makeIgreja(igrejaId);
        User u = makeMembro();
        MembroIgreja mi = MembroIgreja.builder().id(membroId).usuario(u).igreja(i).build();
        when(membroIgrejaRepository.findById(membroId)).thenReturn(Optional.of(mi));

        UUID papelId = UUID.randomUUID();
        Papel papel = Papel.builder().id(papelId).nome("Tesoureiro").igreja(i).build();
        when(papelRepository.findById(papelId)).thenReturn(Optional.of(papel));
        when(membroIgrejaRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        MembroIgrejaResponse result = service.addPapel(membroId, papelId, "admin@test.com");

        assertThat(mi.getPapeis()).contains(papel);
    }

    @Test
    void removePapel_adminCanRemovePapel() {
        User admin = makeAdmin();
        when(userRepository.findByEmail("admin@test.com")).thenReturn(Optional.of(admin));
        UUID membroId = UUID.randomUUID();
        UUID igrejaId = UUID.randomUUID();
        Igreja i = makeIgreja(igrejaId);
        User u = makeMembro();
        UUID papelId = UUID.randomUUID();
        Papel papel = Papel.builder().id(papelId).nome("Tesoureiro").igreja(i).build();
        MembroIgreja mi = MembroIgreja.builder().id(membroId).usuario(u).igreja(i)
                .papeis(new ArrayList<>(List.of(papel))).build();
        when(membroIgrejaRepository.findById(membroId)).thenReturn(Optional.of(mi));
        when(membroIgrejaRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.removePapel(membroId, papelId, "admin@test.com");

        assertThat(mi.getPapeis()).isEmpty();
    }
}
