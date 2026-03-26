package com.nivah.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailServiceTest {

    @Mock RestTemplate restTemplate;

    @InjectMocks EmailService emailService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(emailService, "apiKey", "re_test_key");
        ReflectionTestUtils.setField(emailService, "fromEmail", "onboarding@resend.dev");
    }

    @Test
    void sendVerificationEmail_callsResendApi() {
        when(restTemplate.postForObject(any(String.class), any(), eq(java.util.Map.class)))
                .thenReturn(java.util.Map.of("id", "abc123"));

        emailService.sendVerificationEmail("user@test.com", "João", "123456");

        verify(restTemplate).postForObject(
                eq("https://api.resend.com/emails"), any(), eq(java.util.Map.class));
    }

    @Test
    void sendPasswordResetEmail_callsResendApi() {
        when(restTemplate.postForObject(any(String.class), any(), eq(java.util.Map.class)))
                .thenReturn(java.util.Map.of("id", "abc123"));

        emailService.sendPasswordResetEmail("user@test.com", "Maria", "https://nivah.vercel.app/reset-password?token=abc");

        verify(restTemplate).postForObject(
                eq("https://api.resend.com/emails"), any(), eq(java.util.Map.class));
    }

    @Test
    void sendVerificationEmail_doesNotThrowWhenApiFails() {
        when(restTemplate.postForObject(any(String.class), any(), eq(java.util.Map.class)))
                .thenThrow(new RuntimeException("API error"));

        assertThatCode(
                () -> emailService.sendVerificationEmail("fail@test.com", "Fail", "000000")
        ).doesNotThrowAnyException();
    }

    @Test
    void sendPasswordResetEmail_doesNotThrowWhenApiFails() {
        when(restTemplate.postForObject(any(String.class), any(), eq(java.util.Map.class)))
                .thenThrow(new RuntimeException("API error"));

        assertThatCode(
                () -> emailService.sendPasswordResetEmail("fail@test.com", "Fail", "http://link")
        ).doesNotThrowAnyException();
    }
}
