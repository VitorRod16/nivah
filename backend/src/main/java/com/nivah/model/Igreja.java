package com.nivah.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "igreja")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Igreja {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String nome;

    private String cidade;

    @Column(columnDefinition = "TEXT")
    private String descricao;

    @Builder.Default
    @Column(nullable = false)
    private boolean dizmosAtivo = true;

    @Builder.Default
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "pastor_igreja",
            joinColumns = @JoinColumn(name = "igreja_id"),
            inverseJoinColumns = @JoinColumn(name = "usuario_id")
    )
    private List<User> pastores = new ArrayList<>();
}
