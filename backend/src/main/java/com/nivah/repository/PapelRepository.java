package com.nivah.repository;

import com.nivah.model.Igreja;
import com.nivah.model.Papel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PapelRepository extends JpaRepository<Papel, UUID> {
    List<Papel> findByIgreja(Igreja igreja);
    List<Papel> findByIgreja_Id(UUID igrejaId);
}
