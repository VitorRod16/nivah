package com.nivah.dto;

import lombok.Data;

import java.util.UUID;

@Data
public class MembroIgrejaRequest {
    private String email; // usado para encontrar o usuário
    private UUID igrejaId;
    private String phone;
}
