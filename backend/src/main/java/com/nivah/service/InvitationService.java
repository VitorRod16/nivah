package com.nivah.service;

import com.nivah.dto.InvitationRequest;
import com.nivah.model.Invitation;
import com.nivah.model.Member;
import com.nivah.repository.InvitationRepository;
import com.nivah.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class InvitationService {

    private final RestTemplate restTemplate;
    private final MemberRepository memberRepository;
    private final InvitationRepository invitationRepository;

    @Value("${resend.api.key:}")
    private String apiKey;

    @Value("${app.mail.from:onboarding@resend.dev}")
    private String fromEmail;

    public List<Invitation> findAll() {
        return invitationRepository.findAllByOrderByCreatedAtDesc();
    }

    public Invitation saveDraft(InvitationRequest request) {
        Invitation invitation = Invitation.builder()
                .title(request.getTitle())
                .date(request.getDate())
                .time(request.getTime())
                .location(request.getLocation())
                .message(request.getMessage())
                .allMinistries(request.isAllMinistries())
                .ministryIds(request.getMinistryIds() != null ? request.getMinistryIds() : List.of())
                .status("rascunho")
                .build();
        return invitationRepository.save(invitation);
    }

    public record SendResult(Invitation invitation, int sent) {}

    public SendResult sendInvitations(InvitationRequest request) {
        List<Member> recipients = resolveRecipients(request);

        Invitation invitation = Invitation.builder()
                .title(request.getTitle())
                .date(request.getDate())
                .time(request.getTime())
                .location(request.getLocation())
                .message(request.getMessage())
                .allMinistries(request.isAllMinistries())
                .ministryIds(request.getMinistryIds() != null ? request.getMinistryIds() : List.of())
                .status("enviado")
                .sentDate(LocalDate.now().toString())
                .recipientCount(recipients.size())
                .build();

        Invitation saved = invitationRepository.save(invitation);

        // Envia e-mails em background para não bloquear a resposta HTTP
        CompletableFuture.runAsync(() -> dispatchEmails(recipients, request));

        return new SendResult(saved, recipients.size());
    }

    public Invitation sendDraft(UUID id) {
        Invitation invitation = invitationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Convite não encontrado: " + id));

        InvitationRequest request = new InvitationRequest();
        request.setTitle(invitation.getTitle());
        request.setDate(invitation.getDate());
        request.setTime(invitation.getTime());
        request.setLocation(invitation.getLocation());
        request.setMessage(invitation.getMessage());
        request.setAllMinistries(invitation.isAllMinistries());
        request.setMinistryIds(invitation.getMinistryIds());

        List<Member> recipients = resolveRecipients(request);

        invitation.setStatus("enviado");
        invitation.setSentDate(LocalDate.now().toString());
        invitation.setRecipientCount(recipients.size());

        Invitation saved = invitationRepository.save(invitation);

        // Envia e-mails em background para não bloquear a resposta HTTP
        CompletableFuture.runAsync(() -> dispatchEmails(recipients, request));

        return saved;
    }

    public void delete(UUID id) {
        invitationRepository.deleteById(id);
    }

    // — private helpers —

    private List<Member> resolveRecipients(InvitationRequest request) {
        List<Member> allMembers = memberRepository.findAll();
        return (request.isAllMinistries()
                ? allMembers.stream().filter(m -> StringUtils.hasText(m.getEmail()))
                : allMembers.stream()
                        .filter(m -> StringUtils.hasText(m.getEmail())
                                && request.getMinistryIds().contains(m.getMinistryId())))
                .collect(Collectors.toMap(
                        Member::getEmail,
                        m -> m,
                        (m1, m2) -> m1))
                .values()
                .stream()
                .toList();
    }

    private int dispatchEmails(List<Member> recipients, InvitationRequest request) {
        if (recipients.isEmpty()) return 0;
        String subject = "Convite: " + request.getTitle();
        int sent = 0;
        for (Member member : recipients) {
            try {
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                headers.setBearerAuth(apiKey);

                Map<String, Object> body = Map.of(
                        "from", fromEmail,
                        "to", new String[]{member.getEmail()},
                        "subject", subject,
                        "html", buildEmailHtml(member.getName(), request)
                );

                restTemplate.postForObject(
                        "https://api.resend.com/emails",
                        new HttpEntity<>(body, headers),
                        Map.class
                );
                sent++;
            } catch (Exception e) {
                log.error("Falha ao enviar e-mail para {}: {}", member.getEmail(), e.getMessage());
            }
        }
        return sent;
    }

    private String buildEmailHtml(String recipientName, InvitationRequest req) {
        StringBuilder details = new StringBuilder();
        if (StringUtils.hasText(req.getDate())) details.append(detailRow("📅", "Data", req.getDate()));
        if (StringUtils.hasText(req.getTime())) details.append(detailRow("🕐", "Horário", req.getTime()));
        if (StringUtils.hasText(req.getLocation())) details.append(detailRow("📍", "Local", req.getLocation()));

        String messageBlock = "";
        if (StringUtils.hasText(req.getMessage())) {
            messageBlock = """
                    <div style="margin-top:24px; padding:16px 20px; background:#f0f4ff; border-left:4px solid #4f6ef7; border-radius:6px; color:#374151; font-size:15px; line-height:1.6;">
                      %s
                    </div>
                    """.formatted(req.getMessage().replace("\n", "<br>"));
        }

        return """
                <!DOCTYPE html>
                <html lang="pt-BR">
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="margin:0; padding:0; background-color:#f3f4f6; font-family:'Segoe UI', Arial, sans-serif;">
                  <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f3f4f6; padding:40px 16px;">
                    <tr>
                      <td align="center">
                        <table width="100%%" cellpadding="0" cellspacing="0" style="max-width:560px;">
                          <tr>
                            <td style="background:linear-gradient(135deg,#3b5bdb 0%%,#4f6ef7 100%%); border-radius:12px 12px 0 0; padding:32px 40px; text-align:center;">
                              <img src="cid:logo" alt="Nivah" style="height:56px; margin-bottom:12px; display:block; margin-left:auto; margin-right:auto;" />
                              <p style="margin:0; color:rgba(255,255,255,0.85); font-size:13px; letter-spacing:2px; text-transform:uppercase; font-weight:600;">Sistema de Gestão</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="background:#ffffff; padding:36px 40px;">
                              <p style="margin:0 0 8px; color:#6b7280; font-size:14px;">Olá, <strong style="color:#111827;">%s</strong>!</p>
                              <p style="margin:0 0 28px; color:#374151; font-size:15px;">Você está convidado(a) para o seguinte evento:</p>
                              <div style="background:#f0f4ff; border-radius:8px; padding:18px 20px; margin-bottom:24px;">
                                <p style="margin:0; font-size:20px; font-weight:700; color:#3b5bdb;">%s</p>
                              </div>
                              <table width="100%%" cellpadding="0" cellspacing="0">%s</table>
                              %s
                            </td>
                          </tr>
                          <tr>
                            <td style="background:#f9fafb; border-top:1px solid #e5e7eb; border-radius:0 0 12px 12px; padding:20px 40px; text-align:center;">
                              <p style="margin:0; color:#9ca3af; font-size:12px;">Este é um convite enviado pelo <strong style="color:#6b7280;">Sistema Nivah</strong>. Por favor, não responda este e-mail.</p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
                """.formatted(recipientName, req.getTitle(), details.toString(), messageBlock);
    }

    private String detailRow(String emoji, String label, String value) {
        return """
                <tr>
                  <td style="padding:8px 0; vertical-align:top; width:28px; font-size:18px;">%s</td>
                  <td style="padding:8px 12px 8px 0; vertical-align:top; color:#6b7280; font-size:14px; white-space:nowrap;">%s</td>
                  <td style="padding:8px 0; vertical-align:top; color:#111827; font-size:14px; font-weight:500;">%s</td>
                </tr>
                """.formatted(emoji, label, value);
    }
}
