package com.nivah.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(
    name = "bible_highlight",
    uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "translation", "book_index", "chapter", "verse"})
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class BibleHighlight {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false, length = 10)
    private String translation;

    @Column(name = "book_index", nullable = false)
    private int bookIndex;

    @Column(name = "book_name", nullable = false, length = 100)
    private String bookName;

    @Column(nullable = false)
    private int chapter;

    @Column(nullable = false)
    private int verse;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String text;

    @Column(nullable = false, length = 20)
    private String color;
}
