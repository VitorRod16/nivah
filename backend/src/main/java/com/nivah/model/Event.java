package com.nivah.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "app_event")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String date;

    private String endDate;

    private String description;

    @Column(name = "igreja_id")
    private UUID igrejaId;

    @Builder.Default
    @Column(columnDefinition = "boolean default false")
    private boolean allMinistries = false;

    @Builder.Default
    @Column(columnDefinition = "boolean default false")
    private boolean cancelled = false;

    @Builder.Default
    @Column(columnDefinition = "boolean default false")
    private boolean allowInscriptions = false;

    private Integer maxInscriptions;

    // Camp fields (tipoEvento = "ACAMPAMENTO")
    @Builder.Default
    @Column(nullable = false, columnDefinition = "varchar(20) default 'NORMAL'")
    private String tipoEvento = "NORMAL";

    private Integer vagasMasculino;
    private Integer vagasFeminino;
    private Integer quantidadeQuartos;

    @Builder.Default
    @ElementCollection
    @CollectionTable(name = "event_ministry_ids", joinColumns = @JoinColumn(name = "event_id"))
    @Column(name = "ministry_id")
    private List<String> ministryIds = new ArrayList<>();
}
