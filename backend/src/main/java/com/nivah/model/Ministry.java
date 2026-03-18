package com.nivah.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "ministry")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Ministry {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    private String description;

    private String city;

    private String pastor;
}
