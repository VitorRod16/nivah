package com.nivah.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class TransacaoRequest {
    private String tipo;       // "ENTRADA" ou "SAIDA"
    private BigDecimal valor;
    private String descricao;
    private String categoria;
    private String data;
    private UUID igrejaId;
}
