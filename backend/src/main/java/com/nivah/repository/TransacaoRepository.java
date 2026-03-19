package com.nivah.repository;

import com.nivah.model.Transacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TransacaoRepository extends JpaRepository<Transacao, UUID> {
    List<Transacao> findByIgrejaIdOrderByDataDesc(UUID igrejaId);
    List<Transacao> findByIgrejaIdInOrderByDataDesc(List<UUID> igrejaIds);
}
