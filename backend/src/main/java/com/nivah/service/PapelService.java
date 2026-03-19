package com.nivah.service;

import com.nivah.dto.PapelRequest;
import com.nivah.model.Igreja;
import com.nivah.model.Papel;
import com.nivah.model.Role;
import com.nivah.model.User;
import com.nivah.repository.IgrejaRepository;
import com.nivah.repository.PapelRepository;
import com.nivah.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PapelService {

    private final PapelRepository papelRepository;
    private final IgrejaRepository igrejaRepository;
    private final UserRepository userRepository;

    public List<Papel> findByIgreja(UUID igrejaId, String email) {
        checkAccess(igrejaId, email);
        return papelRepository.findByIgreja_Id(igrejaId);
    }

    public Papel create(UUID igrejaId, PapelRequest request, String email) {
        checkManage(igrejaId, email);
        Igreja igreja = igrejaRepository.findById(igrejaId)
                .orElseThrow(() -> new IllegalArgumentException("Igreja não encontrada."));
        Papel papel = Papel.builder()
                .nome(request.getNome())
                .igreja(igreja)
                .build();
        return papelRepository.save(papel);
    }

    public void delete(UUID igrejaId, UUID papelId, String email) {
        checkManage(igrejaId, email);
        papelRepository.deleteById(papelId);
    }

    // — helpers —

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("Usuário não encontrado."));
    }

    private void checkAccess(UUID igrejaId, String email) {
        User user = getUser(email);
        if (user.getRole() == Role.ADMIN) return;
        Igreja igreja = igrejaRepository.findById(igrejaId)
                .orElseThrow(() -> new IllegalArgumentException("Igreja não encontrada."));
        boolean isPastor = igreja.getPastores().stream().anyMatch(p -> p.getId().equals(user.getId()));
        if (!isPastor) throw new SecurityException("Acesso negado.");
    }

    private void checkManage(UUID igrejaId, String email) {
        checkAccess(igrejaId, email);
    }
}
