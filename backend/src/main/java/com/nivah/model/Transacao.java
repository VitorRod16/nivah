package com.nivah.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "transacao")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Transacao {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /** "ENTRADA" ou "SAIDA" */
    @Column(nullable = false)
    private String tipo;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal valor;

    private String descricao;

    /** Ex: "DÍZIMO", "OFERTA", "DESPESA", "OUTRO" */
    private String categoria;

    /** ISO date string: "2026-03-18" */
    @Column(nullable = false)
    private String data;

    @Column(name = "igreja_id", nullable = false)
    private UUID igrejaId;

    /** Nome do usuário que registrou */
    private String criadoPor;
}
