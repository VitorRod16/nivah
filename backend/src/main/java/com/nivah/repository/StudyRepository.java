package com.nivah.repository;

import com.nivah.model.Study;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface StudyRepository extends JpaRepository<Study, UUID> {
    List<Study> findByIgrejaIdIn(List<UUID> igrejaIds);
}
