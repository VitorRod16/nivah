package com.nivah.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "app_user")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Builder.Default
    @Column(nullable = false)
    private String role = "Membro";
}
