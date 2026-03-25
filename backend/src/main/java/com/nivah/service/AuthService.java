package com.nivah.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.nivah.dto.AuthResponse;
import com.nivah.dto.LoginRequest;
import com.nivah.dto.SignupRequest;
import com.nivah.model.Role;
import com.nivah.model.User;
import com.nivah.repository.UserRepository;
import com.nivah.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;

    @Value("${app.frontend.url:https://nivah.vercel.app}")
    private String frontendUrl;

    @Value("${google.client-id:}")
    private String googleClientId;

    public AuthResponse signup(SignupRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email already registered: " + email);
        }

        Role role = Role.MEMBRO;
        if (StringUtils.hasText(request.getRole())) {
            try {
                role = Role.valueOf(request.getRole().toUpperCase());
            } catch (IllegalArgumentException ignored) {
                role = Role.MEMBRO;
            }
        }

        User user = User.builder()
                .name(request.getName())
                .email(email)
                .password(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .build();

        String code = String.format("%06d", (int)(Math.random() * 1_000_000));
        user.setVerificationCode(code);
        user.setVerificationCodeExpiry(LocalDateTime.now().plusMinutes(15));
        user = userRepository.save(user);

        emailService.sendVerificationEmail(user.getEmail(), user.getName(), code);

        return AuthResponse.builder()
                .email(user.getEmail())
                .needsVerification(true)
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail().trim().toLowerCase(), request.getPassword())
        );

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();

        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalStateException("User not found after authentication"));

        if (!user.isEmailVerified()) {
            throw new IllegalStateException("EMAIL_NOT_VERIFIED:" + user.getEmail());
        }

        String token = jwtTokenProvider.generateToken(userDetails, user.getRole());

        return AuthResponse.builder()
                .token(token)
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .photoUrl(user.getPhotoUrl())
                .status(user.getStatus())
                .build();
    }

    public AuthResponse getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("User not found: " + email));

        return AuthResponse.builder()
                .token(null)
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .photoUrl(user.getPhotoUrl())
                .status(user.getStatus())
                .build();
    }

    public AuthResponse updateUser(String email, String name, String newEmail, String status) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("User not found: " + email));
        if (StringUtils.hasText(name)) user.setName(name);
        if (StringUtils.hasText(newEmail)) {
            String normalizedNew = newEmail.trim().toLowerCase();
            if (!normalizedNew.equals(email)) {
                if (userRepository.existsByEmail(normalizedNew))
                    throw new IllegalArgumentException("E-mail já está em uso.");
                user.setEmail(normalizedNew);
            }
        }
        user.setStatus(status);
        user = userRepository.save(user);
        return AuthResponse.builder()
                .token(null)
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .photoUrl(user.getPhotoUrl())
                .status(user.getStatus())
                .build();
    }

    public AuthResponse updatePhoto(String email, String photoUrl) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("User not found: " + email));
        user.setPhotoUrl(photoUrl);
        user = userRepository.save(user);
        return AuthResponse.builder()
                .token(null)
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .photoUrl(user.getPhotoUrl())
                .status(user.getStatus())
                .build();
    }

    public AuthResponse verifyEmail(String email, String code) {
        String normalizedEmail = email.trim().toLowerCase();
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado."));

        if (user.isEmailVerified()) {
            throw new IllegalArgumentException("Email já verificado.");
        }
        if (user.getVerificationCode() == null || !user.getVerificationCode().equals(code)) {
            throw new IllegalArgumentException("Código inválido.");
        }
        if (user.getVerificationCodeExpiry() == null || user.getVerificationCodeExpiry().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Código expirado. Solicite um novo.");
        }

        user.setEmailVerified(true);
        user.setVerificationCode(null);
        user.setVerificationCodeExpiry(null);
        user = userRepository.save(user);

        UserDetails userDetails = org.springframework.security.core.userdetails.User
                .withUsername(user.getEmail())
                .password(user.getPassword())
                .authorities("ROLE_" + user.getRole().name())
                .build();

        String token = jwtTokenProvider.generateToken(userDetails, user.getRole());

        return AuthResponse.builder()
                .token(token)
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .photoUrl(user.getPhotoUrl())
                .status(user.getStatus())
                .build();
    }

    public void resendVerificationCode(String email) {
        String normalizedEmail = email.trim().toLowerCase();
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado."));

        if (user.isEmailVerified()) {
            throw new IllegalArgumentException("Email já verificado.");
        }

        String code = String.format("%06d", (int)(Math.random() * 1_000_000));
        user.setVerificationCode(code);
        user.setVerificationCodeExpiry(LocalDateTime.now().plusMinutes(15));
        userRepository.save(user);

        emailService.sendVerificationEmail(user.getEmail(), user.getName(), code);
    }

    public AuthResponse googleLogin(String idTokenString) {
        if (!StringUtils.hasText(googleClientId)) {
            throw new IllegalStateException("Google Client ID não configurado.");
        }

        GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                new NetHttpTransport(), GsonFactory.getDefaultInstance())
                .setAudience(Collections.singletonList(googleClientId))
                .build();

        GoogleIdToken idToken;
        try {
            idToken = verifier.verify(idTokenString);
        } catch (Exception e) {
            throw new IllegalArgumentException("Falha ao verificar token do Google.");
        }

        if (idToken == null) {
            throw new IllegalArgumentException("Token do Google inválido.");
        }

        GoogleIdToken.Payload payload = idToken.getPayload();
        String email = payload.getEmail().trim().toLowerCase();
        String name = (String) payload.get("name");
        String pictureUrl = (String) payload.get("picture");

        User user = userRepository.findByEmail(email).orElseGet(() -> {
            User newUser = User.builder()
                    .name(name != null ? name : email)
                    .email(email)
                    .role(Role.MEMBRO)
                    .emailVerified(true)
                    .photoUrl(pictureUrl)
                    .build();
            return userRepository.save(newUser);
        });

        if (!user.isEmailVerified()) {
            user.setEmailVerified(true);
            user = userRepository.save(user);
        }

        UserDetails userDetails = org.springframework.security.core.userdetails.User
                .withUsername(user.getEmail())
                .password(user.getPassword() != null ? user.getPassword() : "")
                .authorities("ROLE_" + user.getRole().name())
                .build();

        String token = jwtTokenProvider.generateToken(userDetails, user.getRole());

        return AuthResponse.builder()
                .token(token)
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .photoUrl(user.getPhotoUrl())
                .status(user.getStatus())
                .build();
    }

    public void forgotPassword(String email) {
        userRepository.findByEmail(email.trim().toLowerCase()).ifPresent(user -> {
            String token = UUID.randomUUID().toString();
            user.setResetToken(token);
            user.setResetTokenExpiry(LocalDateTime.now().plusHours(1));
            userRepository.save(user);

            String link = frontendUrl + "/reset-password?token=" + token;
            emailService.sendPasswordResetEmail(user.getEmail(), user.getName(), link);
        });
        // Sempre retorna sem erro para não revelar se o email existe
    }

    public void changePassword(String email, String currentPassword, String newPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado."));
        if (user.getPassword() == null || !passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new IllegalArgumentException("Senha atual incorreta.");
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    public void resetPassword(String token, String newPassword) {
        User user = userRepository.findByResetToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Token inválido ou expirado."));

        if (user.getResetTokenExpiry() == null || user.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Token expirado. Solicite um novo link.");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        userRepository.save(user);
    }

}
