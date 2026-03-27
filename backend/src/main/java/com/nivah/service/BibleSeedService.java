package com.nivah.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nivah.model.BibleVerse;
import com.nivah.repository.BibleVerseRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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

    // MaatheusGois — aa, acf, arc, kja, nvi  (lowercase, formato: [{abbrev, chapters:[[]]}])
    private static final String MAATHEUS_URL =
        "https://raw.githubusercontent.com/MaatheusGois/bible/main/versions/pt-br/%s.json";

    // damarals/biblias — ARA, NTLH, NAA, AS21, TB, NVT, NBV, ACF, ARC, NVI...  (UPPERCASE)
    // Mesmo formato do MaatheusGois
    private static final String DAMARALS_URL =
        "https://raw.githubusercontent.com/damarals/biblias/main/inst/json/%s.json";

    // Fallback por livro (MaatheusGois)
    private static final String MAATHEUS_BOOK_URL =
        "https://raw.githubusercontent.com/MaatheusGois/bible/main/versions/pt-br/%s/%s/%s.json";

    // Abreviações PT por livro (índice 0 = Gênesis) — usadas no fallback
    private static final String[] ABBREVS = {
        "gn","ex","lv","nm","dt","js","jz","rt","1sm","2sm",
        "1rs","2rs","1cr","2cr","ed","ne","et","jo","sl","pv",
        "ec","ct","is","jr","lm","ez","dn","os","jl","am",
        "ob","jn","mq","na","hc","sf","ag","zc","ml",
        "mt","mc","lc","jo","at","rm","1co","2co","gl","ef",
        "fp","cl","1ts","2ts","1tm","2tm","tt","fm","hb","tg",
        "1pe","2pe","1jo","2jo","3jo","jd","ap"
    };

    // MaatheusGois: arc, nvi, acf, aa, kja
    // damarals:     ara, ntlh, naa
    private static final String[] TRANSLATIONS = {"arc", "nvi", "acf", "aa", "kja", "ara", "ntlh", "naa"};

    private final AtomicBoolean seeding = new AtomicBoolean(false);
    private final AtomicReference<String> status = new AtomicReference<>("idle");

    @PostConstruct
    public void autoSeedIfNeeded() {
        for (String t : TRANSLATIONS) {
            if (bibleVerseRepository.countByTranslation(t) == 0) {
                log.info("Dados da Bíblia incompletos — iniciando seed automático em background...");
                startSeed(false);
                return;
            }
        }
    }

    public boolean isSeeding() { return seeding.get(); }
    public String getStatus()  { return status.get(); }

    public boolean startSeed(boolean force) {
        if (!seeding.compareAndSet(false, true)) return false;
        Thread.ofVirtual().start(() -> doSeed(force));
        return true;
    }

    private void doSeed(boolean force) {
        try {
            for (String t : TRANSLATIONS) {
                if (!force && bibleVerseRepository.countByTranslation(t) > 0) {
                    log.info("Tradução {} já existe, pulando.", t.toUpperCase());
                    continue;
                }
                status.set("baixando " + t.toUpperCase() + "...");

                // Tenta MaatheusGois (lowercase) depois damarals (UPPERCASE), depois fallback por livro
                boolean ok = seedFromSingleFile(MAATHEUS_URL, t)
                          || seedFromSingleFile(DAMARALS_URL, t.toUpperCase());
                if (!ok) {
                    log.warn("Arquivo único falhou para {}. Tentando fallback por livro...", t.toUpperCase());
                    seedFromPerBookFiles(t);
                }

                log.info("Tradução {} concluída. Versículos: {}", t.toUpperCase(),
                    bibleVerseRepository.countByTranslation(t));
            }
            status.set("completed");
            log.info("Seed da Bíblia concluído.");
        } catch (Exception e) {
            log.error("Seed falhou: {}", e.getMessage());
            status.set("error: " + e.getMessage());
        } finally {
            seeding.set(false);
        }
    }

    private boolean seedFromSingleFile(String urlTemplate, String translationCode) {
        try {
            String url = String.format(urlTemplate, translationCode);
            ResponseEntity<String> resp = restTemplate.getForEntity(url, String.class);
            String body = resp.getBody();
            if (body != null && body.startsWith("\uFEFF")) body = body.substring(1);
            JsonNode booksArray = objectMapper.readTree(body);

            if (!booksArray.isArray() || booksArray.isEmpty()) return false;

            for (int bookIdx = 0; bookIdx < booksArray.size(); bookIdx++) {
                JsonNode chaptersNode = booksArray.get(bookIdx).get("chapters");
                saveChapters(translationCode.toLowerCase(), bookIdx + 1, chaptersNode);
            }
            return true;
        } catch (Exception e) {
            log.warn("seedFromSingleFile falhou ({}) : {}", translationCode, e.getMessage());
            return false;
        }
    }

    private void seedFromPerBookFiles(String translation) {
        for (int bookIdx = 0; bookIdx < 66; bookIdx++) {
            String abbrev = ABBREVS[bookIdx];
            try {
                String url = String.format(MAATHEUS_BOOK_URL, translation, abbrev, abbrev);
                ResponseEntity<String> resp = restTemplate.getForEntity(url, String.class);
                JsonNode root = objectMapper.readTree(resp.getBody());
                saveChapters(translation, bookIdx + 1, root.get("chapters"));
            } catch (Exception e) {
                log.warn("Livro {} não encontrado para {}: {}", abbrev, translation, e.getMessage());
            }
        }
    }

    private void saveChapters(String translation, int bookNum, JsonNode chaptersNode) {
        if (chaptersNode == null || !chaptersNode.isArray()) return;
        for (int chIdx = 0; chIdx < chaptersNode.size(); chIdx++) {
            JsonNode versesNode = chaptersNode.get(chIdx);
            List<BibleVerse> verses = new ArrayList<>();
            for (int vIdx = 0; vIdx < versesNode.size(); vIdx++) {
                verses.add(new BibleVerse(
                    translation, bookNum, chIdx + 1, vIdx + 1,
                    versesNode.get(vIdx).asText().trim()
                ));
            }
            bibleVerseRepository.saveAll(verses);
        }
    }
}
