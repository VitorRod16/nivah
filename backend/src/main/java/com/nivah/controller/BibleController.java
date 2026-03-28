package com.nivah.controller;

import com.nivah.model.BibleHighlight;
import com.nivah.model.BibleVerse;
import com.nivah.model.User;
import com.nivah.repository.BibleHighlightRepository;
import com.nivah.repository.BibleVerseRepository;
import com.nivah.repository.UserRepository;
import com.nivah.service.BibleSeedService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/bible")
@RequiredArgsConstructor
public class BibleController {

    private final BibleVerseRepository bibleVerseRepository;
    private final BibleHighlightRepository bibleHighlightRepository;
    private final BibleSeedService bibleSeedService;
    private final UserRepository userRepository;

    private static final Set<String> VALID =
        Set.of("arc", "nvi", "ara", "acf", "aa", "kja", "ntlh", "naa");

    // -------------------------------------------------------------------------
    // Leitura de capítulo
    // -------------------------------------------------------------------------

    @GetMapping("/{translation}/{book}/{chapter}")
    public ResponseEntity<?> getChapter(
            @PathVariable String translation,
            @PathVariable int book,
            @PathVariable int chapter) {

        String t = translation.toLowerCase();
        if (!VALID.contains(t))
            return ResponseEntity.badRequest().body(Map.of("error", "Tradução inválida."));
        if (book < 1 || book > 66 || chapter < 1)
            return ResponseEntity.badRequest().body(Map.of("error", "Referência inválida."));

        List<BibleVerse> verses = bibleVerseRepository
                .findByTranslationAndBookAndChapterOrderByVerseAsc(t, book, chapter);

        if (verses.isEmpty())
            return ResponseEntity.status(503).body(Map.of(
                "error", "Dados não encontrados. Execute o seed via POST /api/bible/seed."));

        List<Map<String, Object>> result = verses.stream()
                .map(v -> Map.<String, Object>of("verse", v.getVerse(), "text", v.getText()))
                .toList();

        return ResponseEntity.ok(result);
    }

    // -------------------------------------------------------------------------
    // Palavra do dia — mesmo versículo para todos no dia, baseado na data
    // -------------------------------------------------------------------------

    @GetMapping("/palavra-do-dia")
    public ResponseEntity<?> palavraDoDia() {
        String translation = "arc";
        long count = bibleVerseRepository.countByTranslation(translation);
        if (count == 0)
            return ResponseEntity.status(503).body(Map.of("error", "Bíblia ainda não carregada."));

        long seed   = LocalDate.now().toEpochDay();
        long offset = Math.abs(new Random(seed).nextLong() % count);

        List<BibleVerse> page = bibleVerseRepository
                .findByTranslation(translation, PageRequest.of((int) offset, 1))
                .getContent();

        if (page.isEmpty())
            return ResponseEntity.status(503).body(Map.of("error", "Erro ao buscar versículo."));

        BibleVerse v = page.get(0);
        return ResponseEntity.ok(Map.of(
            "translation", translation.toUpperCase(),
            "book",        v.getBook(),
            "chapter",     v.getChapter(),
            "verse",       v.getVerse(),
            "text",        v.getText()
        ));
    }

    // -------------------------------------------------------------------------
    // Destaques (requer autenticação)
    // -------------------------------------------------------------------------

    @GetMapping("/highlights")
    public ResponseEntity<?> getHighlights(@AuthenticationPrincipal UserDetails userDetails) {
        User user = findUser(userDetails);
        List<Map<String, Object>> result = bibleHighlightRepository.findByUserId(user.getId())
                .stream()
                .map(h -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id",          h.getId().toString());
                    m.put("translation", h.getTranslation());
                    m.put("bookIndex",   h.getBookIndex());
                    m.put("bookName",    h.getBookName());
                    m.put("chapter",     h.getChapter());
                    m.put("verse",       h.getVerse());
                    m.put("text",        h.getText());
                    m.put("color",       h.getColor());
                    return m;
                })
                .toList();
        return ResponseEntity.ok(result);
    }

    @PostMapping("/highlights")
    public ResponseEntity<?> saveHighlight(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, Object> body) {

        User user = findUser(userDetails);

        BibleHighlight highlight = BibleHighlight.builder()
                .userId(user.getId())
                .translation(str(body, "translation"))
                .bookIndex(num(body, "bookIndex"))
                .bookName(str(body, "bookName"))
                .chapter(num(body, "chapter"))
                .verse(num(body, "verse"))
                .text(str(body, "text"))
                .color(str(body, "color"))
                .build();

        BibleHighlight saved = bibleHighlightRepository.save(highlight);
        return ResponseEntity.ok(Map.of("id", saved.getId().toString()));
    }

    @DeleteMapping("/highlights/{id}")
    public ResponseEntity<?> deleteHighlight(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID id) {

        User user = findUser(userDetails);
        bibleHighlightRepository.deleteByIdAndUserId(id, user.getId());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/highlights")
    public ResponseEntity<?> deleteHighlightByRef(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam String translation,
            @RequestParam int bookIndex,
            @RequestParam int chapter,
            @RequestParam int verse) {

        User user = findUser(userDetails);
        bibleHighlightRepository.deleteByUserIdAndTranslationAndBookIndexAndChapterAndVerse(
            user.getId(), translation.toLowerCase(), bookIndex, chapter, verse);
        return ResponseEntity.noContent().build();
    }

    // -------------------------------------------------------------------------
    // Seed (admin)
    // -------------------------------------------------------------------------

    @PostMapping("/seed")
    public ResponseEntity<?> startSeed(@RequestParam(defaultValue = "false") boolean force) {
        boolean started = bibleSeedService.startSeed(force);
        if (!started)
            return ResponseEntity.status(409).body(Map.of("message", "Seed já em andamento."));
        return ResponseEntity.accepted().body(Map.of(
            "message", "Seed iniciado em background. Consulte GET /api/bible/seed/status."));
    }

    @GetMapping("/seed/status")
    public ResponseEntity<?> seedStatus() {
        return ResponseEntity.ok(Map.of(
            "seeding", bibleSeedService.isSeeding(),
            "status",  bibleSeedService.getStatus()
        ));
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private User findUser(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalStateException("Usuário não encontrado."));
    }

    private static String str(Map<String, Object> m, String key) {
        return String.valueOf(m.getOrDefault(key, ""));
    }

    private static int num(Map<String, Object> m, String key) {
        Object v = m.get(key);
        if (v instanceof Number n) return n.intValue();
        try { return Integer.parseInt(String.valueOf(v)); } catch (Exception e) { return 0; }
    }
}
