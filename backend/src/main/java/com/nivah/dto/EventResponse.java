package com.nivah.dto;

import com.nivah.model.Event;
import com.nivah.model.Inscription;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class EventResponse {

    private UUID id;
    private String title;
    private String date;
    private String endDate;
    private String description;
    private boolean allMinistries;
    private boolean cancelled;
    private List<String> ministryIds;
    private boolean allowInscriptions;
    private Integer maxInscriptions;
    private int inscricoesCount;
    private boolean userInscrito;

    // Camp fields
    private String tipoEvento;
    private Integer vagasMasculino;
    private Integer vagasFeminino;
    private Integer quantidadeQuartos;
    private int inscricosMasculino;
    private int inscricosFeminino;
    private int inscricosCasais;
    private String userTipoParticipante;
    private String userSexo;

    public static EventResponse from(Event e, int inscricoesCount, Inscription userInscription,
                                      int inscricosMasculino, int inscricosFeminino, int inscricosCasais) {
        EventResponse r = new EventResponse();
        r.setId(e.getId());
        r.setTitle(e.getTitle());
        r.setDate(e.getDate());
        r.setEndDate(e.getEndDate());
        r.setDescription(e.getDescription());
        r.setAllMinistries(e.isAllMinistries());
        r.setCancelled(e.isCancelled());
        r.setMinistryIds(e.getMinistryIds());
        r.setAllowInscriptions(e.isAllowInscriptions());
        r.setMaxInscriptions(e.getMaxInscriptions());
        r.setInscricoesCount(inscricoesCount);
        r.setUserInscrito(userInscription != null);
        r.setTipoEvento(e.getTipoEvento() != null ? e.getTipoEvento() : "NORMAL");
        r.setVagasMasculino(e.getVagasMasculino());
        r.setVagasFeminino(e.getVagasFeminino());
        r.setQuantidadeQuartos(e.getQuantidadeQuartos());
        r.setInscricosMasculino(inscricosMasculino);
        r.setInscricosFeminino(inscricosFeminino);
        r.setInscricosCasais(inscricosCasais);
        if (userInscription != null) {
            r.setUserTipoParticipante(userInscription.getTipoParticipante());
            r.setUserSexo(userInscription.getSexo());
        }
        return r;
    }
}
