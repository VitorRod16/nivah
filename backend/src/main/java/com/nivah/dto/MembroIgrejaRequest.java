package com.nivah.dto;

import lombok.Data;

import java.util.UUID;

@Data
public class MembroIgrejaRequest {
    private String email;
    private UUID igrejaId;
    private String phone;
    private String name;     // para criar usuário novo se não existir
    private String password; // senha inicial (opcional — gera aleatória se omitida)
}
