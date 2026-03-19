package com.nivah.repository;

import com.nivah.model.Igreja;
import com.nivah.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface IgrejaRepository extends JpaRepository<Igreja, UUID> {
    List<Igreja> findByPastoresContaining(User pastor);
}
