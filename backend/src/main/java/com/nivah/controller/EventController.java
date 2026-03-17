package com.nivah.controller;

import com.nivah.model.Event;
import com.nivah.repository.EventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {

    private final EventRepository eventRepository;

    @GetMapping
    public ResponseEntity<List<Event>> getAll() {
        return ResponseEntity.ok(eventRepository.findAll());
    }

    @PostMapping
    public ResponseEntity<Event> create(@RequestBody Event event) {
        Event saved = eventRepository.save(event);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Event> update(@PathVariable UUID id, @RequestBody Event event) {
        if (!eventRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        event.setId(id);
        Event saved = eventRepository.save(event);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        if (!eventRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        eventRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
