package com.nivah.controller;

import com.nivah.model.BibleVerse;
import com.nivah.repository.BibleVerseRepository;
import com.nivah.service.BibleSeedService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/bible")
@RequiredArgsConstructor
public class BibleController {

    private final BibleVerseRepository bibleVerseRepository;
    private final BibleSeedService bibleSeedService;

    private static final Set<String> VALID = Set.of("arc", "nvi", "ara", "acf");

    @GetMapping("/{translation}/{book}/{chapter}")
    public ResponseEntity<?> getChapter(
            @PathVariable String translation,
            @PathVariable int book,
            @PathVariable int chapter) {

        String t = translation.toLowerCase();
        if (!VALID.contains(t)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Tradução inválida."));
        }
        if (book < 1 || book > 66 || chapter < 1) {
            return ResponseEntity.badRequest().body(Map.of("error", "Referência inválida."));
        }

        List<BibleVerse> verses = bibleVerseRepository
                .findByTranslationAndBookAndChapterOrderByVerseAsc(t, book, chapter);

        if (verses.isEmpty()) {
            return ResponseEntity.status(503).body(Map.of(
                "error", "Dados não encontrados. Execute o seed via POST /api/bible/seed."));
        }

        List<Map<String, Object>> result = verses.stream()
                .map(v -> Map.<String, Object>of("verse", v.getVerse(), "text", v.getText()))
                .toList();

        return ResponseEntity.ok(result);
    }

    // ADMIN: inicia o seed (force=true refaz capítulos já existentes)
    @PostMapping("/seed")
    public ResponseEntity<?> startSeed(@RequestParam(defaultValue = "false") boolean force) {
        boolean started = bibleSeedService.startSeed(force);
        if (!started) {
            return ResponseEntity.status(409).body(Map.of("message", "Seed já em andamento."));
        }
        return ResponseEntity.accepted().body(Map.of(
            "message", "Seed iniciado em background. Consulte GET /api/bible/seed/status."));
    }

    // ADMIN: status do seed
    @GetMapping("/seed/status")
    public ResponseEntity<?> seedStatus() {
        return ResponseEntity.ok(Map.of(
            "seeding", bibleSeedService.isSeeding(),
            "status",  bibleSeedService.getStatus()
        ));
    }
}
