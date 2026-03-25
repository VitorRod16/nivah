package com.nivah.service;

import com.nivah.model.Igreja;
import com.nivah.model.MembroIgreja;
import com.nivah.model.Role;
import com.nivah.model.User;
import com.nivah.repository.IgrejaRepository;
import com.nivah.repository.MembroIgrejaRepository;
import com.nivah.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ChurchAccessServiceTest {

    @Mock UserRepository userRepository;
    @Mock IgrejaRepository igrejaRepository;
    @Mock MembroIgrejaRepository membroIgrejaRepository;

    @InjectMocks ChurchAccessService service;

    // ── isAdmin ──────────────────────────────────────────────────────────────

    @Test
    void isAdmin_returnsTrueForAdminUser() {
        User admin = User.builder().email("admin@test.com").role(Role.ADMIN).build();
        when(userRepository.findByEmail("admin@test.com")).thenReturn(Optional.of(admin));

        assertThat(service.isAdmin("admin@test.com")).isTrue();
    }

    @Test
    void isAdmin_returnsFalseForPastor() {
        User pastor = User.builder().email("pastor@test.com").role(Role.PASTOR).build();
        when(userRepository.findByEmail("pastor@test.com")).thenReturn(Optional.of(pastor));

        assertThat(service.isAdmin("pastor@test.com")).isFalse();
    }

    @Test
    void isAdmin_returnsFalseForMembro() {
        User membro = User.builder().email("m@test.com").role(Role.MEMBRO).build();
        when(userRepository.findByEmail("m@test.com")).thenReturn(Optional.of(membro));

        assertThat(service.isAdmin("m@test.com")).isFalse();
    }

    @Test
    void isAdmin_returnsFalseWhenUserNotFound() {
        when(userRepository.findByEmail("ghost@test.com")).thenReturn(Optional.empty());

        assertThat(service.isAdmin("ghost@test.com")).isFalse();
    }

    // ── getAccessibleIgrejaIds ────────────────────────────────────────────────

    @Test
    void getAccessibleIgrejaIds_adminGetsAllIgrejas() {
        User admin = User.builder().email("admin@test.com").role(Role.ADMIN).build();
        when(userRepository.findByEmail("admin@test.com")).thenReturn(Optional.of(admin));

        UUID id1 = UUID.randomUUID();
        UUID id2 = UUID.randomUUID();
        Igreja i1 = Igreja.builder().id(id1).nome("A").build();
        Igreja i2 = Igreja.builder().id(id2).nome("B").build();
        when(igrejaRepository.findAll()).thenReturn(List.of(i1, i2));

        List<UUID> ids = service.getAccessibleIgrejaIds("admin@test.com");

        assertThat(ids).containsExactlyInAnyOrder(id1, id2);
    }

    @Test
    void getAccessibleIgrejaIds_pastorGetsOwnIgrejas() {
        User pastor = User.builder().id(UUID.randomUUID()).email("pastor@test.com").role(Role.PASTOR).build();
        when(userRepository.findByEmail("pastor@test.com")).thenReturn(Optional.of(pastor));

        UUID id1 = UUID.randomUUID();
        Igreja i1 = Igreja.builder().id(id1).nome("Minha Igreja").build();
        when(igrejaRepository.findByPastoresContaining(pastor)).thenReturn(List.of(i1));

        List<UUID> ids = service.getAccessibleIgrejaIds("pastor@test.com");

        assertThat(ids).containsExactly(id1);
        verify(igrejaRepository, never()).findAll();
    }

    @Test
    void getAccessibleIgrejaIds_membroGetsOnlyMemberChurches() {
        User membro = User.builder().id(UUID.randomUUID()).email("m@test.com").role(Role.MEMBRO).build();
        when(userRepository.findByEmail("m@test.com")).thenReturn(Optional.of(membro));

        UUID id1 = UUID.randomUUID();
        Igreja i1 = Igreja.builder().id(id1).nome("Igreja 1").build();
        MembroIgreja mi = MembroIgreja.builder().usuario(membro).igreja(i1).build();
        when(membroIgrejaRepository.findByUsuario(membro)).thenReturn(List.of(mi));

        List<UUID> ids = service.getAccessibleIgrejaIds("m@test.com");

        assertThat(ids).containsExactly(id1);
    }

    @Test
    void getAccessibleIgrejaIds_throwsWhenUserNotFound() {
        when(userRepository.findByEmail("unknown@test.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getAccessibleIgrejaIds("unknown@test.com"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("User not found");
    }

    @Test
    void getAccessibleIgrejaIds_returnsEmptyListForMembroWithNoChurches() {
        User membro = User.builder().id(UUID.randomUUID()).email("m@test.com").role(Role.MEMBRO).build();
        when(userRepository.findByEmail("m@test.com")).thenReturn(Optional.of(membro));
        when(membroIgrejaRepository.findByUsuario(membro)).thenReturn(List.of());

        List<UUID> ids = service.getAccessibleIgrejaIds("m@test.com");

        assertThat(ids).isEmpty();
    }
}
