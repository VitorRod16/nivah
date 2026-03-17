package com.nivah.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "member")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Member {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    private String email;

    private String phone;

    @Column(name = "ministry_id")
    private String ministryId;
}
