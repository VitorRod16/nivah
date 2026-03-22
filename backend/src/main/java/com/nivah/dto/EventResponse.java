package com.nivah.dto;

import com.nivah.model.Event;
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

    public static EventResponse from(Event e, int inscricoesCount, boolean userInscrito) {
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
        r.setUserInscrito(userInscrito);
        return r;
    }
}
