package com.nivah.repository;

import com.nivah.model.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EventRepository extends JpaRepository<Event, UUID> {
    List<Event> findByIgrejaIdIn(List<UUID> igrejaIds);

    List<Event> findByIgrejaIdInOrIgrejaIdIsNull(List<UUID> igrejaIds);
}
