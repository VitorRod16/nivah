package com.nivah.repository;

import com.nivah.model.Ministry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface MinistryRepository extends JpaRepository<Ministry, UUID> {
}
