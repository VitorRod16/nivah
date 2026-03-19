package com.nivah.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "membro_igreja", uniqueConstraints = @UniqueConstraint(columnNames = {"usuario_id", "igreja_id"}))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MembroIgreja {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "usuario_id", nullable = false)
    private User usuario;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "igreja_id", nullable = false)
    private Igreja igreja;

    private String phone;

    @Builder.Default
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "membro_papel",
            joinColumns = @JoinColumn(name = "membro_igreja_id"),
            inverseJoinColumns = @JoinColumn(name = "papel_id")
    )
    private List<Papel> papeis = new ArrayList<>();
}
