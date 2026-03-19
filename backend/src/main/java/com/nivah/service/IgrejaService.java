package com.nivah.service;

import com.nivah.dto.IgrejaRequest;
import com.nivah.model.Igreja;
import com.nivah.model.Role;
import com.nivah.model.User;
import com.nivah.repository.IgrejaRepository;
import com.nivah.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class IgrejaService {

    private final IgrejaRepository igrejaRepository;
    private final UserRepository userRepository;

    public List<Igreja> findAllPublic() {
        return igrejaRepository.findAll();
    }


    public List<Igreja> findAll(String email) {
        User user = getUser(email);
        if (user.getRole() == Role.ADMIN) {
            return igrejaRepository.findAll();
        }
        return igrejaRepository.findByPastoresContaining(user);
    }

    public Igreja findById(UUID id, String email) {
        Igreja igreja = igrejaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Igreja não encontrada: " + id));
        checkAccess(igreja, email);
        return igreja;
    }

    public Igreja create(IgrejaRequest request, String email) {
        User user = getUser(email);
        Igreja igreja = Igreja.builder()
                .nome(request.getNome())
                .cidade(request.getCidade())
                .descricao(request.getDescricao())
                .build();
        // Se for PASTOR, já se adiciona como responsável
        if (user.getRole() == Role.PASTOR) {
            igreja.getPastores().add(user);
        }
        return igrejaRepository.save(igreja);
    }

    public Igreja update(UUID id, IgrejaRequest request, String email) {
        Igreja igreja = igrejaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Igreja não encontrada: " + id));
        checkManage(igreja, email);
        igreja.setNome(request.getNome());
        if (request.getCidade() != null) igreja.setCidade(request.getCidade());
        if (request.getDescricao() != null) igreja.setDescricao(request.getDescricao());
        return igrejaRepository.save(igreja);
    }

    public void delete(UUID id, String email) {
        User user = getUser(email);
        if (user.getRole() != Role.ADMIN) {
            throw new SecurityException("Apenas administradores podem excluir igrejas.");
        }
        igrejaRepository.deleteById(id);
    }

    public Igreja addPastor(UUID igrejaId, UUID usuarioId, String email) {
        User requester = getUser(email);
        if (requester.getRole() != Role.ADMIN) {
            throw new SecurityException("Apenas administradores podem gerenciar pastores.");
        }
        Igreja igreja = igrejaRepository.findById(igrejaId)
                .orElseThrow(() -> new IllegalArgumentException("Igreja não encontrada."));
        User pastor = userRepository.findById(usuarioId)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado."));
        if (!igreja.getPastores().contains(pastor)) {
            pastor.setRole(Role.PASTOR);
            userRepository.save(pastor);
            igreja.getPastores().add(pastor);
            igrejaRepository.save(igreja);
        }
        return igreja;
    }

    public Igreja removePastor(UUID igrejaId, UUID usuarioId, String email) {
        User requester = getUser(email);
        if (requester.getRole() != Role.ADMIN) {
            throw new SecurityException("Apenas administradores podem gerenciar pastores.");
        }
        Igreja igreja = igrejaRepository.findById(igrejaId)
                .orElseThrow(() -> new IllegalArgumentException("Igreja não encontrada."));
        igreja.getPastores().removeIf(p -> p.getId().equals(usuarioId));
        return igrejaRepository.save(igreja);
    }

    // — helpers —

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("Usuário não encontrado: " + email));
    }

    private void checkAccess(Igreja igreja, String email) {
        User user = getUser(email);
        if (user.getRole() == Role.ADMIN) return;
        boolean isPastor = igreja.getPastores().stream().anyMatch(p -> p.getId().equals(user.getId()));
        if (!isPastor) {
            throw new SecurityException("Acesso negado a esta igreja.");
        }
    }

    private void checkManage(Igreja igreja, String email) {
        checkAccess(igreja, email);
    }
}
