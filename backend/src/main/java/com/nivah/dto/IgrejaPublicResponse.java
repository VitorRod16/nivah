package com.nivah.dto;

import com.nivah.model.Igreja;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.UUID;

@Data
@AllArgsConstructor
public class IgrejaPublicResponse {
    private UUID id;
    private String nome;
    private String cidade;

    public static IgrejaPublicResponse from(Igreja ig) {
        return new IgrejaPublicResponse(ig.getId(), ig.getNome(), ig.getCidade());
    }
}
