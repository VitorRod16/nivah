package com.nivah.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "invitation")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Invitation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String title;

    private String date;
    private String time;
    private String location;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Builder.Default
    @Column(nullable = false)
    private String status = "rascunho";

    @Builder.Default
    @Column(columnDefinition = "boolean default false")
    private boolean allMinistries = false;

    @Builder.Default
    @ElementCollection
    @CollectionTable(name = "invitation_ministry_ids", joinColumns = @JoinColumn(name = "invitation_id"))
    @Column(name = "ministry_id")
    private List<String> ministryIds = new ArrayList<>();

    private String sentDate;

    @Builder.Default
    private int recipientCount = 0;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
