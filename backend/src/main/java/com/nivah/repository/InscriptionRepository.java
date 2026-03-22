package com.nivah.repository;

import com.nivah.model.Event;
import com.nivah.model.Inscription;
import com.nivah.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InscriptionRepository extends JpaRepository<Inscription, UUID> {

    List<Inscription> findByEvent(Event event);

    Optional<Inscription> findByEventAndUser(Event event, User user);

    int countByEvent(Event event);

    boolean existsByEventAndUser(Event event, User user);
}
