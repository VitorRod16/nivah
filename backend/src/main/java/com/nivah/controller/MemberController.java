package com.nivah.controller;

import com.nivah.model.Member;
import com.nivah.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/members")
@RequiredArgsConstructor
public class MemberController {

    private final MemberRepository memberRepository;

    @GetMapping
    public ResponseEntity<List<Member>> getAll() {
        return ResponseEntity.ok(memberRepository.findAll());
    }

    @PostMapping
    public ResponseEntity<Member> create(@RequestBody Member member) {
        Member saved = memberRepository.save(member);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Member> update(@PathVariable UUID id, @RequestBody Member member) {
        if (!memberRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        member.setId(id);
        Member saved = memberRepository.save(member);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        if (!memberRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        memberRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
