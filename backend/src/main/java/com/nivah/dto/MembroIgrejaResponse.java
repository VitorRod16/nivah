package com.nivah.dto;

import com.nivah.model.MembroIgreja;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
@AllArgsConstructor
public class MembroIgrejaResponse {

    private UUID id;
    private UUID usuarioId;
    private String nome;
    private String email;
    private String phone;
    private String photoUrl;
    private UUID igrejaId;
    private String igrejaName;
    private List<PapelInfo> papeis;

    public record PapelInfo(UUID id, String nome) {}

    public static MembroIgrejaResponse from(MembroIgreja m) {
        return new MembroIgrejaResponse(
                m.getId(),
                m.getUsuario().getId(),
                m.getUsuario().getName(),
                m.getUsuario().getEmail(),
                m.getPhone(),
                m.getUsuario().getPhotoUrl(),
                m.getIgreja().getId(),
                m.getIgreja().getNome(),
                m.getPapeis().stream()
                        .map(p -> new PapelInfo(p.getId(), p.getNome()))
                        .toList()
        );
    }
}
