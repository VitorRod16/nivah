package com.nivah.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "song")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Song {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String title;

    private String artist;

    private String link;
}
