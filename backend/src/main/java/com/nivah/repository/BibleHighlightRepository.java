package com.nivah.repository;

import com.nivah.model.BibleHighlight;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface BibleHighlightRepository extends JpaRepository<BibleHighlight, UUID> {

    List<BibleHighlight> findByUserId(UUID userId);

    void deleteByIdAndUserId(UUID id, UUID userId);

    void deleteByUserIdAndTranslationAndBookIndexAndChapterAndVerse(
        UUID userId, String translation, int bookIndex, int chapter, int verse);
}
