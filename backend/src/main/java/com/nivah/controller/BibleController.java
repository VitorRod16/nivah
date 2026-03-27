package com.nivah.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

@RestController
@RequestMapping("/api/bible")
@RequiredArgsConstructor
@Slf4j
public class BibleController {

    private final RestTemplate restTemplate;

    private static final java.util.Set<String> ALLOWED_TRANSLATIONS =
            java.util.Set.of("almeida", "ara", "nvi", "acf");

    @GetMapping("/{translation}/{book}/{chapter}")
    public ResponseEntity<String> getChapter(
            @PathVariable String translation,
            @PathVariable int book,
            @PathVariable int chapter) {

        if (!ALLOWED_TRANSLATIONS.contains(translation)) {
            return ResponseEntity.badRequest().body("{\"error\":\"Tradução inválida.\"}");
        }
        if (book < 1 || book > 66 || chapter < 1) {
            return ResponseEntity.badRequest().body("{\"error\":\"Referência inválida.\"}");
        }

        try {
            String url = String.format("https://getbible.net/v2/%s/%d/%d.json", translation, book, chapter);
            String body = restTemplate.getForObject(url, String.class);
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body);
        } catch (Exception e) {
            log.warn("Falha ao buscar Bíblia ({} {}/{}): {}", translation, book, chapter, e.getMessage());
            return ResponseEntity.status(503).body("{\"error\":\"Serviço indisponível.\"}");
        }
    }
}
