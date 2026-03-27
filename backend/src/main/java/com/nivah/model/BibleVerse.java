package com.nivah.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(
    name = "bible_verse",
    indexes = @Index(name = "idx_bible_verse_lookup", columnList = "translation,book,chapter")
)
@Getter @Setter @NoArgsConstructor
public class BibleVerse {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "bible_verse_seq")
    @SequenceGenerator(name = "bible_verse_seq", sequenceName = "bible_verse_seq", allocationSize = 100)
    private Long id;

    @Column(nullable = false, length = 10)
    private String translation;

    @Column(nullable = false)
    private int book;

    @Column(nullable = false)
    private int chapter;

    @Column(nullable = false)
    private int verse;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String text;

    public BibleVerse(String translation, int book, int chapter, int verse, String text) {
        this.translation = translation;
        this.book        = book;
        this.chapter     = chapter;
        this.verse       = verse;
        this.text        = text;
    }
}
