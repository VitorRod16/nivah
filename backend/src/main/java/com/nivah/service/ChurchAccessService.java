package com.nivah.service;

import com.nivah.model.Igreja;
import com.nivah.model.Role;
import com.nivah.model.User;
import com.nivah.repository.IgrejaRepository;
import com.nivah.repository.MembroIgrejaRepository;
import com.nivah.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ChurchAccessService {

    private final UserRepository userRepository;
    private final IgrejaRepository igrejaRepository;
    private final MembroIgrejaRepository membroIgrejaRepository;

    public boolean isAdmin(String email) {
        return userRepository.findByEmail(email)
                .map(u -> u.getRole() == Role.ADMIN)
                .orElse(false);
    }

    /** Returns the list of igrejaIds the user can access. Empty list = no access. */
    public List<UUID> getAccessibleIgrejaIds(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("User not found: " + email));

        return switch (user.getRole()) {
            case ADMIN -> igrejaRepository.findAll().stream().map(Igreja::getId).toList();
            case PASTOR -> igrejaRepository.findByPastoresContaining(user).stream()
                    .map(Igreja::getId).toList();
            case MEMBRO -> membroIgrejaRepository.findByUsuario(user).stream()
                    .map(m -> m.getIgreja().getId()).toList();
        };
    }
}
