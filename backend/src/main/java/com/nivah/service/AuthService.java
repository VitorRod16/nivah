package com.nivah.service;

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
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import jakarta.mail.internet.MimeMessage;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;
    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.frontend.url:https://nivah.vercel.app}")
    private String frontendUrl;

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

        sendVerificationEmail(user.getEmail(), user.getName(), code);

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

        sendVerificationEmail(user.getEmail(), user.getName(), code);
    }

    private void sendVerificationEmail(String email, String name, String code) {
        try {
            MimeMessage mail = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mail, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(email);
            helper.setSubject("Verificação de email — Nivah");
            helper.setText(buildVerificationEmailHtml(name, code), true);
            mailSender.send(mail);
        } catch (Exception e) {
            log.error("Falha ao enviar email de verificação para {}: {}", email, e.getMessage());
        }
    }

    private String buildVerificationEmailHtml(String name, String code) {
        return """
                <!DOCTYPE html>
                <html lang="pt-BR">
                <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
                <body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif;">
                  <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 16px;">
                    <tr><td align="center">
                      <table width="100%%" cellpadding="0" cellspacing="0" style="max-width:560px;">
                        <tr>
                          <td style="background:linear-gradient(135deg,#3b5bdb 0%%,#4f6ef7 100%%);border-radius:12px 12px 0 0;padding:32px 40px;text-align:center;">
                            <p style="margin:0;color:#fff;font-size:22px;font-weight:700;letter-spacing:1px;">Nivah</p>
                            <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">Sistema de Gestão</p>
                          </td>
                        </tr>
                        <tr>
                          <td style="background:#fff;padding:36px 40px;text-align:center;">
                            <p style="margin:0 0 8px;color:#6b7280;font-size:14px;text-align:left;">Olá, <strong style="color:#111827;">%s</strong>!</p>
                            <p style="margin:0 0 28px;color:#374151;font-size:15px;text-align:left;">Use o código abaixo para verificar seu email e concluir o cadastro:</p>
                            <div style="background:#f0f4ff;border-radius:12px;padding:24px 32px;margin:0 auto 24px;display:inline-block;">
                              <p style="margin:0;font-size:40px;font-weight:800;letter-spacing:12px;color:#3b5bdb;font-family:monospace;">%s</p>
                            </div>
                            <p style="margin:0;color:#9ca3af;font-size:13px;text-align:left;">Este código expira em <strong>15 minutos</strong>. Se você não criou uma conta no Nivah, ignore este email.</p>
                          </td>
                        </tr>
                        <tr>
                          <td style="background:#f9fafb;border-top:1px solid #e5e7eb;border-radius:0 0 12px 12px;padding:20px 40px;text-align:center;">
                            <p style="margin:0;color:#9ca3af;font-size:12px;">Enviado pelo <strong style="color:#6b7280;">Sistema Nivah</strong>. Por favor, não responda este email.</p>
                          </td>
                        </tr>
                      </table>
                    </td></tr>
                  </table>
                </body>
                </html>
                """.formatted(name, code);
    }

    public void forgotPassword(String email) {
        userRepository.findByEmail(email.trim().toLowerCase()).ifPresent(user -> {
            String token = UUID.randomUUID().toString();
            user.setResetToken(token);
            user.setResetTokenExpiry(LocalDateTime.now().plusHours(1));
            userRepository.save(user);

            String link = frontendUrl + "/reset-password?token=" + token;
            try {
                MimeMessage mail = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(mail, true, "UTF-8");
                helper.setFrom(fromEmail);
                helper.setTo(user.getEmail());
                helper.setSubject("Redefinição de senha — Nivah");
                helper.setText(buildResetEmailHtml(user.getName(), link), true);
                mailSender.send(mail);
            } catch (Exception e) {
                log.error("Falha ao enviar email de reset para {}: {}", email, e.getMessage());
            }
        });
        // Sempre retorna sem erro para não revelar se o email existe
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

    private String buildResetEmailHtml(String name, String link) {
        return """
                <!DOCTYPE html>
                <html lang="pt-BR">
                <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
                <body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif;">
                  <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 16px;">
                    <tr><td align="center">
                      <table width="100%%" cellpadding="0" cellspacing="0" style="max-width:560px;">
                        <tr>
                          <td style="background:linear-gradient(135deg,#3b5bdb 0%%,#4f6ef7 100%%);border-radius:12px 12px 0 0;padding:32px 40px;text-align:center;">
                            <p style="margin:0;color:#fff;font-size:22px;font-weight:700;letter-spacing:1px;">Nivah</p>
                            <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">Sistema de Gestão</p>
                          </td>
                        </tr>
                        <tr>
                          <td style="background:#fff;padding:36px 40px;">
                            <p style="margin:0 0 8px;color:#6b7280;font-size:14px;">Olá, <strong style="color:#111827;">%s</strong>!</p>
                            <p style="margin:0 0 24px;color:#374151;font-size:15px;">Recebemos uma solicitação para redefinir sua senha. Clique no botão abaixo para criar uma nova senha:</p>
                            <div style="text-align:center;margin:28px 0;">
                              <a href="%s" style="display:inline-block;background:#3b5bdb;color:#fff;font-size:15px;font-weight:600;padding:14px 32px;border-radius:8px;text-decoration:none;">Redefinir minha senha</a>
                            </div>
                            <p style="margin:24px 0 0;color:#9ca3af;font-size:13px;">Este link expira em <strong>1 hora</strong>. Se você não solicitou a redefinição, ignore este email.</p>
                          </td>
                        </tr>
                        <tr>
                          <td style="background:#f9fafb;border-top:1px solid #e5e7eb;border-radius:0 0 12px 12px;padding:20px 40px;text-align:center;">
                            <p style="margin:0;color:#9ca3af;font-size:12px;">Enviado pelo <strong style="color:#6b7280;">Sistema Nivah</strong>. Por favor, não responda este email.</p>
                          </td>
                        </tr>
                      </table>
                    </td></tr>
                  </table>
                </body>
                </html>
                """.formatted(name, link);
    }
}
