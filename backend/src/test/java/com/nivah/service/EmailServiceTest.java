package com.nivah.service;

import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailServiceTest {

    @Mock JavaMailSender mailSender;
    @Mock MimeMessage mimeMessage;

    @InjectMocks EmailService emailService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(emailService, "fromEmail", "noreply@nivah.com");
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
    }

    @Test
    void sendVerificationEmail_callsMailSenderSend() {
        emailService.sendVerificationEmail("user@test.com", "João", "123456");

        verify(mailSender).send(mimeMessage);
    }

    @Test
    void sendPasswordResetEmail_callsMailSenderSend() {
        emailService.sendPasswordResetEmail("user@test.com", "Maria", "https://nivah.vercel.app/reset-password?token=abc");

        verify(mailSender).send(mimeMessage);
    }

    @Test
    void sendVerificationEmail_doesNotThrowWhenMailFails() {
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        doThrow(new RuntimeException("SMTP error")).when(mailSender).send(any(MimeMessage.class));

        // Should not propagate exception — only log it
        org.assertj.core.api.Assertions.assertThatCode(
                () -> emailService.sendVerificationEmail("fail@test.com", "Fail", "000000")
        ).doesNotThrowAnyException();
    }

    @Test
    void sendPasswordResetEmail_doesNotThrowWhenMailFails() {
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        doThrow(new RuntimeException("SMTP error")).when(mailSender).send(any(MimeMessage.class));

        org.assertj.core.api.Assertions.assertThatCode(
                () -> emailService.sendPasswordResetEmail("fail@test.com", "Fail", "http://link")
        ).doesNotThrowAnyException();
    }
}
