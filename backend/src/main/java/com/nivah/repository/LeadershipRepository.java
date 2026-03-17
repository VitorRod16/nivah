package com.nivah.repository;

import com.nivah.model.Leadership;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface LeadershipRepository extends JpaRepository<Leadership, UUID> {
}
