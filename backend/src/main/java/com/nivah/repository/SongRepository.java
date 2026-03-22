package com.nivah.repository;

import com.nivah.model.Song;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SongRepository extends JpaRepository<Song, UUID> {
    List<Song> findByIgrejaIdIn(List<UUID> igrejaIds);
}
