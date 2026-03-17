package com.nivah.controller;

import com.nivah.dto.AuthResponse;
import com.nivah.dto.LoginRequest;
import com.nivah.dto.SignupRequest;
import com.nivah.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/signup")
    public ResponseEntity<AuthResponse> signup(@RequestBody SignupRequest request) {
        AuthResponse response = authService.signup(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<AuthResponse> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        AuthResponse response = authService.getCurrentUser(email);
        return ResponseEntity.ok(response);
    }
}
