package com.nivah.dto;

import lombok.Data;

import java.util.List;

@Data
public class InvitationRequest {
    private String title;
    private String date;
    private String time;
    private String location;
    private String message;
    private boolean allMinistries;
    private List<String> ministryIds;
}
