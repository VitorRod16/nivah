package com.nivah.repository;

import com.nivah.model.Igreja;
import com.nivah.model.MembroIgreja;
import com.nivah.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MembroIgrejaRepository extends JpaRepository<MembroIgreja, UUID> {
    List<MembroIgreja> findByIgreja(Igreja igreja);
    List<MembroIgreja> findByIgreja_Id(UUID igrejaId);
    List<MembroIgreja> findByIgrejaIn(List<Igreja> igrejas);
    List<MembroIgreja> findByUsuario(User usuario);
    Optional<MembroIgreja> findByUsuarioAndIgreja(User usuario, Igreja igreja);
}
