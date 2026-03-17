package com.nivah.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "leadership")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Leadership {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "member_id", nullable = false)
    private String memberId;

    @Builder.Default
    @ElementCollection
    @CollectionTable(name = "leadership_roles", joinColumns = @JoinColumn(name = "leadership_id"))
    @Column(name = "role")
    private List<String> roles = new ArrayList<>();

    @Builder.Default
    @ElementCollection
    @CollectionTable(name = "leadership_ministry_ids", joinColumns = @JoinColumn(name = "leadership_id"))
    @Column(name = "ministry_id")
    private List<String> ministryIds = new ArrayList<>();
}
