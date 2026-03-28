package com.nivah.repository;

import com.nivah.model.BibleVerse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BibleVerseRepository extends JpaRepository<BibleVerse, Long> {

    List<BibleVerse> findByTranslationAndBookAndChapterOrderByVerseAsc(
            String translation, int book, int chapter);

    boolean existsByTranslationAndBookAndChapter(String translation, int book, int chapter);

    long countByTranslation(String translation);

    Page<BibleVerse> findByTranslation(String translation, Pageable pageable);
}
