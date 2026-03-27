package com.nivah.service;

import com.nivah.dto.MembroIgrejaRequest;
import com.nivah.dto.MembroIgrejaResponse;
import com.nivah.model.*;
import com.nivah.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MembroIgrejaService {

    private final MembroIgrejaRepository membroIgrejaRepository;
    private final IgrejaRepository igrejaRepository;
    private final PapelRepository papelRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public List<MembroIgrejaResponse> findAll(String email) {
        User user = getUser(email);
        if (user.getRole() == Role.ADMIN) {
            List<MembroIgreja> membros = membroIgrejaRepository.findAll();
            Set<UUID> linkedUserIds = membros.stream()
                    .map(m -> m.getUsuario().getId())
                    .collect(Collectors.toSet());
            List<MembroIgrejaResponse> result = new ArrayList<>(membros.stream().map(MembroIgrejaResponse::from).toList());
            userRepository.findAll().stream()
                    .filter(u -> !linkedUserIds.contains(u.getId()))
                    .map(MembroIgrejaResponse::fromUser)
                    .forEach(result::add);
            return result;
        }
        List<MembroIgreja> membros = switch (user.getRole()) {
            case PASTOR -> {
                List<Igreja> igrejas = igrejaRepository.findByPastoresContaining(user);
                yield membroIgrejaRepository.findByIgrejaIn(igrejas);
            }
            case MEMBRO -> {
                List<Igreja> igrejas = membroIgrejaRepository.findByUsuario(user)
                        .stream().map(MembroIgreja::getIgreja).toList();
                yield membroIgrejaRepository.findByIgrejaIn(igrejas);
            }
            default -> List.of();
        };
        return membros.stream().map(MembroIgrejaResponse::from).toList();
    }

    public MembroIgrejaResponse add(MembroIgrejaRequest request, String email) {
        checkCanManage(request.getIgrejaId(), email);

        String membroEmail = request.getEmail().trim().toLowerCase();
        User usuario = userRepository.findByEmail(membroEmail)
                .orElseGet(() -> {
                    if (!StringUtils.hasText(request.getName())) {
                        throw new IllegalArgumentException("Nome é obrigatório para cadastrar um novo membro.");
                    }
                    String rawPassword = StringUtils.hasText(request.getPassword())
                            ? request.getPassword()
                            : UUID.randomUUID().toString();
                    return userRepository.save(User.builder()
                            .name(request.getName())
                            .email(membroEmail)
                            .password(passwordEncoder.encode(rawPassword))
                            .role(Role.MEMBRO)
                            .build());
                });

        Igreja igreja = igrejaRepository.findById(request.getIgrejaId())
                .orElseThrow(() -> new IllegalArgumentException("Igreja não encontrada."));

        membroIgrejaRepository.findByUsuarioAndIgreja(usuario, igreja).ifPresent(m -> {
            throw new IllegalStateException("Usuário já é membro desta igreja.");
        });

        MembroIgreja membro = MembroIgreja.builder()
                .usuario(usuario)
                .igreja(igreja)
                .phone(request.getPhone())
                .build();

        return MembroIgrejaResponse.from(membroIgrejaRepository.save(membro));
    }

    public MembroIgrejaResponse update(UUID id, MembroIgrejaRequest request, String email) {
        MembroIgreja membro = membroIgrejaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Membro não encontrado."));
        checkCanManage(membro.getIgreja().getId(), email);
        if (request.getPhone() != null) membro.setPhone(request.getPhone());
        return MembroIgrejaResponse.from(membroIgrejaRepository.save(membro));
    }

    public void delete(UUID id, String email) {
        MembroIgreja membro = membroIgrejaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Membro não encontrado."));
        checkCanManage(membro.getIgreja().getId(), email);
        membroIgrejaRepository.deleteById(id);
    }

    public MembroIgrejaResponse addPapel(UUID membroId, UUID papelId, String email) {
        MembroIgreja membro = membroIgrejaRepository.findById(membroId)
                .orElseThrow(() -> new IllegalArgumentException("Membro não encontrado."));
        checkCanManage(membro.getIgreja().getId(), email);
        Papel papel = papelRepository.findById(papelId)
                .orElseThrow(() -> new IllegalArgumentException("Papel não encontrado."));
        if (!membro.getPapeis().contains(papel)) {
            membro.getPapeis().add(papel);
        }
        return MembroIgrejaResponse.from(membroIgrejaRepository.save(membro));
    }

    public MembroIgrejaResponse removePapel(UUID membroId, UUID papelId, String email) {
        MembroIgreja membro = membroIgrejaRepository.findById(membroId)
                .orElseThrow(() -> new IllegalArgumentException("Membro não encontrado."));
        checkCanManage(membro.getIgreja().getId(), email);
        membro.getPapeis().removeIf(p -> p.getId().equals(papelId));
        return MembroIgrejaResponse.from(membroIgrejaRepository.save(membro));
    }

    // — helpers —

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("Usuário não encontrado."));
    }

    private void checkCanManage(UUID igrejaId, String email) {
        User user = getUser(email);
        if (user.getRole() == Role.ADMIN) return;
        if (user.getRole() == Role.MEMBRO) throw new SecurityException("Acesso negado.");
        Igreja igreja = igrejaRepository.findById(igrejaId)
                .orElseThrow(() -> new IllegalArgumentException("Igreja não encontrada."));
        boolean isPastor = igreja.getPastores().stream().anyMatch(p -> p.getId().equals(user.getId()));
        if (!isPastor) throw new SecurityException("Acesso negado: você não é pastor desta igreja.");
    }
}
