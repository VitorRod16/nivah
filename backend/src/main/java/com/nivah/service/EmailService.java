package com.nivah.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from:onboarding@resend.dev}")
    private String fromEmail;

    @Async
    public void sendVerificationEmail(String email, String name, String code) {
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

    @Async
    public void sendPasswordResetEmail(String email, String name, String link) {
        try {
            MimeMessage mail = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mail, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(email);
            helper.setSubject("Redefinição de senha — Nivah");
            helper.setText(buildResetEmailHtml(name, link), true);
            mailSender.send(mail);
        } catch (Exception e) {
            log.error("Falha ao enviar email de reset para {}: {}", email, e.getMessage());
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
