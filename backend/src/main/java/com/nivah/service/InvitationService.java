package com.nivah.service;

import com.nivah.dto.InvitationRequest;
import com.nivah.model.Member;
import com.nivah.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import org.springframework.util.StringUtils;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class InvitationService {

    private final JavaMailSender mailSender;
    private final MemberRepository memberRepository;

    @Value("${spring.mail.username}")
    private String fromEmail;

    public int sendInvitations(InvitationRequest request) {
        List<Member> allMembers = memberRepository.findAll();

        List<Member> recipients = (request.isAllMinistries()
                ? allMembers.stream().filter(m -> StringUtils.hasText(m.getEmail()))
                : allMembers.stream()
                    .filter(m -> StringUtils.hasText(m.getEmail())
                            && request.getMinistryIds().contains(m.getMinistryId())))
                .collect(Collectors.toMap(
                        Member::getEmail,
                        m -> m,
                        (m1, m2) -> m1   // keep first in case of duplicate emails
                ))
                .values()
                .stream()
                .toList();

        if (recipients.isEmpty()) return 0;

        String subject = "Convite: " + request.getTitle();
        String body = buildEmailBody(request);

        int sent = 0;
        for (Member member : recipients) {
            try {
                SimpleMailMessage mail = new SimpleMailMessage();
                mail.setFrom(fromEmail);
                mail.setTo(member.getEmail());
                mail.setSubject(subject);
                mail.setText("Olá, " + member.getName() + "!\n\n" + body);
                mailSender.send(mail);
                sent++;
            } catch (Exception e) {
                log.error("Falha ao enviar e-mail para {}: {}", member.getEmail(), e.getMessage());
            }
        }

        return sent;
    }

    private String buildEmailBody(InvitationRequest req) {
        StringBuilder sb = new StringBuilder();
        sb.append("Você está convidado(a) para:\n\n");
        sb.append("📅 Evento: ").append(req.getTitle()).append("\n");
        if (StringUtils.hasText(req.getDate()))
            sb.append("📆 Data: ").append(req.getDate()).append("\n");
        if (StringUtils.hasText(req.getTime()))
            sb.append("🕐 Horário: ").append(req.getTime()).append("\n");
        if (StringUtils.hasText(req.getLocation()))
            sb.append("📍 Local: ").append(req.getLocation()).append("\n");
        if (StringUtils.hasText(req.getMessage())) {
            sb.append("\n").append(req.getMessage()).append("\n");
        }
        sb.append("\n— Sistema Nivah");
        return sb.toString();
    }
}
