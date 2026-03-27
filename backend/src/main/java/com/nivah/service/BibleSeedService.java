package com.nivah.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nivah.model.BibleVerse;
import com.nivah.repository.BibleVerseRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;

@Service
@RequiredArgsConstructor
@Slf4j
public class BibleSeedService {

    private final BibleVerseRepository bibleVerseRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${bible.api.token:}")
    private String apiToken;

    // Número de capítulos por livro (índice 0 = Gênesis)
    private static final int[] CHAPTER_COUNTS = {
        50, 40, 27, 36, 34, 24, 21,  4, 31, 24,  // 1–10
        22, 25, 29, 36, 10, 13, 10, 42,150, 31,  // 11–20
        12,  8, 66, 52,  5, 48, 12, 14,  3,  9,  // 21–30
         1,  4,  7,  3,  3,  3,  2, 14,  4,      // 31–39
        28, 16, 24, 21, 28, 16, 16, 13,  6,  6,  // 40–49
         4,  4,  5,  3,  6,  4,  3,  1, 13,  5,  // 50–59
         5,  3,  5,  1,  1,  1, 22              // 60–66
    };

    private static final String[] ABBREVS = {
        "gn","ex","lv","nm","dt","js","jz","rt","1sm","2sm",
        "1rs","2rs","1cr","2cr","ed","ne","et","jó","sl","pv",
        "ec","ct","is","jr","lm","ez","dn","os","jl","am",
        "ob","jn","mq","na","hc","sf","ag","zc","ml",
        "mt","mc","lc","jo","at","rm","1co","2co","gl","ef",
        "fp","cl","1ts","2ts","1tm","2tm","tt","fm","hb","tg",
        "1pe","2pe","1jo","2jo","3jo","jd","ap"
    };

    private static final String[] TRANSLATIONS = {"arc", "nvi", "ara", "acf"};

    private final AtomicBoolean seeding = new AtomicBoolean(false);
    private final AtomicReference<String> status = new AtomicReference<>("idle");

    @PostConstruct
    public void autoSeedIfNeeded() {
        boolean missingData = false;
        for (String t : TRANSLATIONS) {
            if (bibleVerseRepository.countByTranslation(t) == 0) {
                missingData = true;
                break;
            }
        }
        if (missingData) {
            log.info("Dados da Bíblia incompletos — iniciando seed automático em background...");
            startSeed(false);
        }
    }

    public boolean isSeeding() {
        return seeding.get();
    }

    public String getStatus() {
        return status.get();
    }

    public boolean startSeed(boolean force) {
        if (!seeding.compareAndSet(false, true)) {
            return false; // já em andamento
        }
        Thread.ofVirtual().start(() -> doSeed(force));
        return true;
    }

    private void doSeed(boolean force) {
        try {
            int totalChapters = 0;
            for (int c : CHAPTER_COUNTS) totalChapters += c;
            int total = TRANSLATIONS.length * totalChapters;
            int done = 0;

            for (String t : TRANSLATIONS) {
                for (int book = 1; book <= 66; book++) {
                    int chapters = CHAPTER_COUNTS[book - 1];
                    for (int ch = 1; ch <= chapters; ch++) {
                        if (!force && bibleVerseRepository.existsByTranslationAndBookAndChapter(t, book, ch)) {
                            done++;
                            continue;
                        }
                        try {
                            String abbrev = ABBREVS[book - 1];
                            String url = String.format(
                                "https://www.abibliadigital.com.br/api/verses/%s/%s/%d", t, abbrev, ch);

                            HttpHeaders headers = new HttpHeaders();
                            headers.set("Accept", "application/json");
                            if (!apiToken.isBlank()) headers.setBearerAuth(apiToken);

                            ResponseEntity<String> resp = restTemplate.exchange(
                                url, HttpMethod.GET, new HttpEntity<>(headers), String.class);

                            JsonNode root = objectMapper.readTree(resp.getBody());
                            JsonNode versesNode = root.get("verses");

                            List<BibleVerse> verses = new ArrayList<>();
                            for (JsonNode v : versesNode) {
                                verses.add(new BibleVerse(
                                    t, book, ch,
                                    v.get("number").asInt(),
                                    v.get("text").asText().trim()
                                ));
                            }
                            bibleVerseRepository.saveAll(verses);
                            done++;

                            int pct = done * 100 / total;
                            status.set(String.format("seeding: %d/%d (%d%%) — %s livro %d cap %d",
                                done, total, pct, t.toUpperCase(), book, ch));

                            Thread.sleep(600); // respeita rate limit da API
                        } catch (Exception e) {
                            log.warn("Seed falhou ({} {}/{}): {}", t, book, ch, e.getMessage());
                            Thread.sleep(3000); // back-off em caso de erro
                        }
                    }
                }
                log.info("Tradução {} concluída.", t.toUpperCase());
            }
            status.set("completed");
            log.info("Seed da Bíblia concluído.");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            status.set("interrupted");
        } catch (Exception e) {
            log.error("Seed falhou: {}", e.getMessage());
            status.set("error: " + e.getMessage());
        } finally {
            seeding.set(false);
        }
    }
}
