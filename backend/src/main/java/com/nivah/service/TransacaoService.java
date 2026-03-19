package com.nivah.service;

import com.nivah.dto.TransacaoRequest;
import com.nivah.model.*;
import com.nivah.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TransacaoService {

    private final TransacaoRepository transacaoRepository;
    private final IgrejaRepository igrejaRepository;
    private final MembroIgrejaRepository membroIgrejaRepository;
    private final UserRepository userRepository;

    public List<Transacao> findAll(String email) {
        User user = getUser(email);
        return switch (user.getRole()) {
            case ADMIN -> transacaoRepository.findAll();
            case PASTOR -> {
                List<Igreja> igrejas = igrejaRepository.findByPastoresContaining(user);
                List<UUID> ids = igrejas.stream().map(Igreja::getId).toList();
                yield transacaoRepository.findByIgrejaIdInOrderByDataDesc(ids);
            }
            case MEMBRO -> {
                List<MembroIgreja> membros = membroIgrejaRepository.findByUsuario(user);
                List<UUID> ids = membros.stream().map(m -> m.getIgreja().getId()).toList();
                yield transacaoRepository.findByIgrejaIdInOrderByDataDesc(ids);
            }
        };
    }

    public Transacao create(TransacaoRequest request, String email) {
        checkCanManage(request.getIgrejaId(), email);
        User user = getUser(email);

        Igreja igreja = igrejaRepository.findById(request.getIgrejaId())
                .orElseThrow(() -> new IllegalArgumentException("Igreja não encontrada."));
        if (Boolean.FALSE.equals(igreja.getDizmosAtivo())) {
            throw new IllegalStateException("Dízimos e ofertas estão desativados para esta igreja.");
        }

        Transacao t = Transacao.builder()
                .tipo(request.getTipo())
                .valor(request.getValor())
                .descricao(request.getDescricao())
                .categoria(request.getCategoria())
                .data(request.getData())
                .igrejaId(request.getIgrejaId())
                .criadoPor(user.getName())
                .build();
        return transacaoRepository.save(t);
    }

    public Transacao update(UUID id, TransacaoRequest request, String email) {
        Transacao t = transacaoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Transação não encontrada."));
        checkCanManage(t.getIgrejaId(), email);
        t.setTipo(request.getTipo());
        t.setValor(request.getValor());
        t.setDescricao(request.getDescricao());
        t.setCategoria(request.getCategoria());
        t.setData(request.getData());
        return transacaoRepository.save(t);
    }

    public void delete(UUID id, String email) {
        Transacao t = transacaoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Transação não encontrada."));
        checkCanManage(t.getIgrejaId(), email);
        transacaoRepository.deleteById(id);
    }

    // — helpers —

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("Usuário não encontrado."));
    }

    private void checkCanManage(UUID igrejaId, String email) {
        User user = getUser(email);
        if (user.getRole() == Role.ADMIN) return;
        if (user.getRole() == Role.MEMBRO) throw new SecurityException("Membros não podem registrar transações.");
        Igreja igreja = igrejaRepository.findById(igrejaId)
                .orElseThrow(() -> new IllegalArgumentException("Igreja não encontrada."));
        boolean isPastor = igreja.getPastores().stream().anyMatch(p -> p.getId().equals(user.getId()));
        if (!isPastor) throw new SecurityException("Acesso negado: você não é pastor desta igreja.");
    }
}
