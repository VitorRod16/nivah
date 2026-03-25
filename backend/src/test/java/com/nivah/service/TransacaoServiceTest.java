package com.nivah.service;

import com.nivah.dto.TransacaoRequest;
import com.nivah.model.*;
import com.nivah.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TransacaoServiceTest {

    @Mock TransacaoRepository transacaoRepository;
    @Mock IgrejaRepository igrejaRepository;
    @Mock MembroIgrejaRepository membroIgrejaRepository;
    @Mock UserRepository userRepository;

    @InjectMocks TransacaoService service;

    private User makeUser(Role role) {
        return User.builder().id(UUID.randomUUID()).name("User").email("u@test.com").role(role).build();
    }

    private Igreja makeIgreja(UUID id, Boolean dizmosAtivo, User... pastores) {
        Igreja i = Igreja.builder().id(id).nome("Igreja").dizmosAtivo(dizmosAtivo)
                .pastores(new ArrayList<>(List.of(pastores))).build();
        return i;
    }

    private TransacaoRequest makeRequest(UUID igrejaId) {
        TransacaoRequest r = new TransacaoRequest();
        r.setTipo("ENTRADA");
        r.setValor(BigDecimal.valueOf(100));
        r.setCategoria("DÍZIMO");
        r.setData("2026-03-01");
        r.setIgrejaId(igrejaId);
        return r;
    }

    // ── findAll ───────────────────────────────────────────────────────────────

    @Test
    void findAll_adminGetsAllTransacoes() {
        User admin = makeUser(Role.ADMIN);
        when(userRepository.findByEmail("u@test.com")).thenReturn(Optional.of(admin));
        Transacao t = Transacao.builder().id(UUID.randomUUID()).tipo("ENTRADA").build();
        when(transacaoRepository.findAll()).thenReturn(List.of(t));

        List<Transacao> result = service.findAll("u@test.com");

        assertThat(result).hasSize(1);
    }

    @Test
    void findAll_pastorGetsTransacoesByIgreja() {
        User pastor = makeUser(Role.PASTOR);
        when(userRepository.findByEmail("u@test.com")).thenReturn(Optional.of(pastor));
        UUID igrejaId = UUID.randomUUID();
        Igreja i = makeIgreja(igrejaId, true, pastor);
        when(igrejaRepository.findByPastoresContaining(pastor)).thenReturn(List.of(i));
        Transacao t = Transacao.builder().id(UUID.randomUUID()).igrejaId(igrejaId).build();
        when(transacaoRepository.findByIgrejaIdInOrderByDataDesc(List.of(igrejaId))).thenReturn(List.of(t));

        List<Transacao> result = service.findAll("u@test.com");

        assertThat(result).hasSize(1);
    }

    @Test
    void findAll_membroGetsTransacoesByMembership() {
        User membro = makeUser(Role.MEMBRO);
        when(userRepository.findByEmail("u@test.com")).thenReturn(Optional.of(membro));
        UUID igrejaId = UUID.randomUUID();
        Igreja i = makeIgreja(igrejaId, true);
        MembroIgreja mi = MembroIgreja.builder().usuario(membro).igreja(i).build();
        when(membroIgrejaRepository.findByUsuario(membro)).thenReturn(List.of(mi));
        Transacao t = Transacao.builder().id(UUID.randomUUID()).igrejaId(igrejaId).build();
        when(transacaoRepository.findByIgrejaIdInOrderByDataDesc(List.of(igrejaId))).thenReturn(List.of(t));

        List<Transacao> result = service.findAll("u@test.com");

        assertThat(result).hasSize(1);
    }

    // ── create ────────────────────────────────────────────────────────────────

    @Test
    void create_adminCanCreateTransacao() {
        User admin = makeUser(Role.ADMIN);
        when(userRepository.findByEmail("u@test.com")).thenReturn(Optional.of(admin));
        UUID igrejaId = UUID.randomUUID();
        Igreja i = makeIgreja(igrejaId, true);
        when(igrejaRepository.findById(igrejaId)).thenReturn(Optional.of(i));
        when(transacaoRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Transacao result = service.create(makeRequest(igrejaId), "u@test.com");

        assertThat(result.getTipo()).isEqualTo("ENTRADA");
        assertThat(result.getCriadoPor()).isEqualTo("User");
    }

    @Test
    void create_pastorCanCreateForOwnIgreja() {
        User pastor = makeUser(Role.PASTOR);
        when(userRepository.findByEmail("u@test.com")).thenReturn(Optional.of(pastor));
        UUID igrejaId = UUID.randomUUID();
        Igreja i = makeIgreja(igrejaId, true, pastor);
        when(igrejaRepository.findById(igrejaId)).thenReturn(Optional.of(i));
        when(transacaoRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Transacao result = service.create(makeRequest(igrejaId), "u@test.com");

        assertThat(result).isNotNull();
    }

    @Test
    void create_throwsWhenDizmosDesativado() {
        User admin = makeUser(Role.ADMIN);
        when(userRepository.findByEmail("u@test.com")).thenReturn(Optional.of(admin));
        UUID igrejaId = UUID.randomUUID();
        Igreja i = makeIgreja(igrejaId, false);
        when(igrejaRepository.findById(igrejaId)).thenReturn(Optional.of(i));

        assertThatThrownBy(() -> service.create(makeRequest(igrejaId), "u@test.com"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("desativados");
    }

    @Test
    void create_throwsForMembroRole() {
        User membro = makeUser(Role.MEMBRO);
        when(userRepository.findByEmail("u@test.com")).thenReturn(Optional.of(membro));
        UUID igrejaId = UUID.randomUUID();

        assertThatThrownBy(() -> service.create(makeRequest(igrejaId), "u@test.com"))
                .isInstanceOf(SecurityException.class)
                .hasMessageContaining("Membros não podem registrar");
    }

    @Test
    void create_throwsForPastorNotOfIgreja() {
        User pastor = makeUser(Role.PASTOR);
        when(userRepository.findByEmail("u@test.com")).thenReturn(Optional.of(pastor));
        UUID igrejaId = UUID.randomUUID();
        Igreja i = makeIgreja(igrejaId, true); // no pastores
        when(igrejaRepository.findById(igrejaId)).thenReturn(Optional.of(i));

        assertThatThrownBy(() -> service.create(makeRequest(igrejaId), "u@test.com"))
                .isInstanceOf(SecurityException.class)
                .hasMessageContaining("Acesso negado");
    }

    // ── update ────────────────────────────────────────────────────────────────

    @Test
    void update_adminCanUpdateTransacao() {
        User admin = makeUser(Role.ADMIN);
        when(userRepository.findByEmail("u@test.com")).thenReturn(Optional.of(admin));
        UUID id = UUID.randomUUID();
        UUID igrejaId = UUID.randomUUID();
        Transacao t = Transacao.builder().id(id).tipo("ENTRADA").igrejaId(igrejaId).build();
        when(transacaoRepository.findById(id)).thenReturn(Optional.of(t));
        when(transacaoRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        TransacaoRequest req = makeRequest(igrejaId);
        req.setTipo("SAIDA");

        Transacao result = service.update(id, req, "u@test.com");

        assertThat(result.getTipo()).isEqualTo("SAIDA");
    }

    @Test
    void update_throwsWhenTransacaoNotFound() {
        UUID id = UUID.randomUUID();
        when(transacaoRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.update(id, makeRequest(UUID.randomUUID()), "u@test.com"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("não encontrada");
    }

    // ── delete ────────────────────────────────────────────────────────────────

    @Test
    void delete_adminCanDelete() {
        User admin = makeUser(Role.ADMIN);
        when(userRepository.findByEmail("u@test.com")).thenReturn(Optional.of(admin));
        UUID id = UUID.randomUUID();
        UUID igrejaId = UUID.randomUUID();
        Transacao t = Transacao.builder().id(id).igrejaId(igrejaId).build();
        when(transacaoRepository.findById(id)).thenReturn(Optional.of(t));

        service.delete(id, "u@test.com");

        verify(transacaoRepository).deleteById(id);
    }

    @Test
    void delete_throwsWhenTransacaoNotFound() {
        UUID id = UUID.randomUUID();
        when(transacaoRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.delete(id, "u@test.com"))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
