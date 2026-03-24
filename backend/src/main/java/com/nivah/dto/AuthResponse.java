package com.nivah.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private UUID id;
    private String name;
    private String email;
    private String role;
    private String photoUrl;
    private String status;
    private boolean needsVerification;
}
