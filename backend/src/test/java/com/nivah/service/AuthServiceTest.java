package com.nivah.service;

import com.nivah.dto.AuthResponse;
import com.nivah.dto.LoginRequest;
import com.nivah.dto.SignupRequest;
import com.nivah.model.Role;
import com.nivah.model.User;
import com.nivah.repository.UserRepository;
import com.nivah.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock UserRepository userRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock JwtTokenProvider jwtTokenProvider;
    @Mock AuthenticationManager authenticationManager;
    @Mock EmailService emailService;

    @InjectMocks AuthService authService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(authService, "frontendUrl", "https://nivah.vercel.app");
        ReflectionTestUtils.setField(authService, "googleClientId", "");
    }

    // ── signup ──────────────────────────────────────────────────────────────

    @Test
    void signup_savesUserAndSendsVerificationEmail() {
        SignupRequest req = new SignupRequest();
        req.setName("João");
        req.setEmail("joao@test.com");
        req.setPassword("senha123");

        when(userRepository.existsByEmail("joao@test.com")).thenReturn(false);
        when(passwordEncoder.encode("senha123")).thenReturn("encoded");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        AuthResponse response = authService.signup(req);

        assertThat(response.isNeedsVerification()).isTrue();
        assertThat(response.getEmail()).isEqualTo("joao@test.com");
        verify(emailService).sendVerificationEmail(eq("joao@test.com"), eq("João"), anyString());
    }

    @Test
    void signup_throwsWhenEmailAlreadyRegistered() {
        SignupRequest req = new SignupRequest();
        req.setEmail("existing@test.com");
        req.setPassword("abc");

        when(userRepository.existsByEmail("existing@test.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.signup(req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("already registered");
    }

    @Test
    void signup_normalizesEmailToLowercase() {
        SignupRequest req = new SignupRequest();
        req.setName("Maria");
        req.setEmail("MARIA@TEST.COM");
        req.setPassword("pass");

        when(userRepository.existsByEmail("maria@test.com")).thenReturn(false);
        when(passwordEncoder.encode(any())).thenReturn("encoded");
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        AuthResponse response = authService.signup(req);

        assertThat(response.getEmail()).isEqualTo("maria@test.com");
    }

    @Test
    void signup_usesMembroRoleByDefault() {
        SignupRequest req = new SignupRequest();
        req.setName("Test");
        req.setEmail("test@test.com");
        req.setPassword("pass");

        when(userRepository.existsByEmail(any())).thenReturn(false);
        when(passwordEncoder.encode(any())).thenReturn("enc");

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        when(userRepository.save(captor.capture())).thenAnswer(inv -> inv.getArgument(0));

        authService.signup(req);

        assertThat(captor.getValue().getRole()).isEqualTo(Role.MEMBRO);
    }

    // ── login ───────────────────────────────────────────────────────────────

    @Test
    void login_returnsTokenForVerifiedUser() {
        LoginRequest req = new LoginRequest();
        req.setEmail("user@test.com");
        req.setPassword("pass");

        UserDetails ud = org.springframework.security.core.userdetails.User
                .withUsername("user@test.com").password("enc").authorities("ROLE_MEMBRO").build();
        Authentication auth = mock(Authentication.class);
        when(auth.getPrincipal()).thenReturn(ud);
        when(authenticationManager.authenticate(any())).thenReturn(auth);

        User user = User.builder().id(UUID.randomUUID()).name("User").email("user@test.com")
                .role(Role.MEMBRO).emailVerified(true).build();
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(jwtTokenProvider.generateToken(any(), eq(Role.MEMBRO))).thenReturn("jwt-token");

        AuthResponse response = authService.login(req);

        assertThat(response.getToken()).isEqualTo("jwt-token");
        assertThat(response.getEmail()).isEqualTo("user@test.com");
    }

    @Test
    void login_throwsWhenEmailNotVerified() {
        LoginRequest req = new LoginRequest();
        req.setEmail("unverified@test.com");
        req.setPassword("pass");

        UserDetails ud = org.springframework.security.core.userdetails.User
                .withUsername("unverified@test.com").password("enc").authorities("ROLE_MEMBRO").build();
        Authentication auth = mock(Authentication.class);
        when(auth.getPrincipal()).thenReturn(ud);
        when(authenticationManager.authenticate(any())).thenReturn(auth);

        User user = User.builder().email("unverified@test.com").emailVerified(false).role(Role.MEMBRO).build();
        when(userRepository.findByEmail("unverified@test.com")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> authService.login(req))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("EMAIL_NOT_VERIFIED");
    }

    // ── verifyEmail ─────────────────────────────────────────────────────────

    @Test
    void verifyEmail_setsEmailVerifiedAndReturnsToken() {
        User user = User.builder()
                .id(UUID.randomUUID()).name("Ana").email("ana@test.com").password("enc")
                .role(Role.MEMBRO).emailVerified(false)
                .verificationCode("123456")
                .verificationCodeExpiry(LocalDateTime.now().plusMinutes(10))
                .build();

        when(userRepository.findByEmail("ana@test.com")).thenReturn(Optional.of(user));
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(jwtTokenProvider.generateToken(any(), eq(Role.MEMBRO))).thenReturn("tok");

        AuthResponse response = authService.verifyEmail("ana@test.com", "123456");

        assertThat(response.getToken()).isEqualTo("tok");
        assertThat(user.isEmailVerified()).isTrue();
        assertThat(user.getVerificationCode()).isNull();
    }

    @Test
    void verifyEmail_throwsForWrongCode() {
        User user = User.builder()
                .email("x@test.com").emailVerified(false)
                .verificationCode("999999")
                .verificationCodeExpiry(LocalDateTime.now().plusMinutes(10))
                .build();

        when(userRepository.findByEmail("x@test.com")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> authService.verifyEmail("x@test.com", "000000"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Código inválido");
    }

    @Test
    void verifyEmail_throwsForExpiredCode() {
        User user = User.builder()
                .email("x@test.com").emailVerified(false)
                .verificationCode("123456")
                .verificationCodeExpiry(LocalDateTime.now().minusMinutes(1))
                .build();

        when(userRepository.findByEmail("x@test.com")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> authService.verifyEmail("x@test.com", "123456"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("expirado");
    }

    @Test
    void verifyEmail_throwsWhenAlreadyVerified() {
        User user = User.builder().email("v@test.com").emailVerified(true).build();
        when(userRepository.findByEmail("v@test.com")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> authService.verifyEmail("v@test.com", "123456"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("já verificado");
    }

    // ── resendVerificationCode ───────────────────────────────────────────────

    @Test
    void resendVerificationCode_updatesCodeAndSendsEmail() {
        User user = User.builder()
                .email("r@test.com").name("Rui").emailVerified(false).build();

        when(userRepository.findByEmail("r@test.com")).thenReturn(Optional.of(user));
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        authService.resendVerificationCode("r@test.com");

        verify(emailService).sendVerificationEmail(eq("r@test.com"), eq("Rui"), anyString());
        assertThat(user.getVerificationCode()).isNotNull();
        assertThat(user.getVerificationCodeExpiry()).isAfter(LocalDateTime.now());
    }

    @Test
    void resendVerificationCode_throwsWhenAlreadyVerified() {
        User user = User.builder().email("v@test.com").emailVerified(true).build();
        when(userRepository.findByEmail("v@test.com")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> authService.resendVerificationCode("v@test.com"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("já verificado");
    }

    // ── forgotPassword ───────────────────────────────────────────────────────

    @Test
    void forgotPassword_generatesTokenAndSendsEmail() {
        User user = User.builder()
                .id(UUID.randomUUID()).name("Pedro").email("pedro@test.com").role(Role.MEMBRO).build();

        when(userRepository.findByEmail("pedro@test.com")).thenReturn(Optional.of(user));
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        authService.forgotPassword("pedro@test.com");

        assertThat(user.getResetToken()).isNotNull();
        assertThat(user.getResetTokenExpiry()).isAfter(LocalDateTime.now());
        verify(emailService).sendPasswordResetEmail(eq("pedro@test.com"), eq("Pedro"), contains(user.getResetToken()));
    }

    @Test
    void forgotPassword_doesNothingForUnknownEmail() {
        when(userRepository.findByEmail("ghost@test.com")).thenReturn(Optional.empty());

        assertThatCode(() -> authService.forgotPassword("ghost@test.com")).doesNotThrowAnyException();
        verify(emailService, never()).sendPasswordResetEmail(any(), any(), any());
    }

    // ── resetPassword ────────────────────────────────────────────────────────

    @Test
    void resetPassword_changesPasswordAndClearsToken() {
        String token = UUID.randomUUID().toString();
        User user = User.builder()
                .resetToken(token)
                .resetTokenExpiry(LocalDateTime.now().plusHours(1))
                .build();

        when(userRepository.findByResetToken(token)).thenReturn(Optional.of(user));
        when(passwordEncoder.encode("newPass")).thenReturn("encodedNew");
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        authService.resetPassword(token, "newPass");

        assertThat(user.getPassword()).isEqualTo("encodedNew");
        assertThat(user.getResetToken()).isNull();
        assertThat(user.getResetTokenExpiry()).isNull();
    }

    @Test
    void resetPassword_throwsForInvalidToken() {
        when(userRepository.findByResetToken("bad-token")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.resetPassword("bad-token", "pass"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("inválido");
    }

    @Test
    void resetPassword_throwsForExpiredToken() {
        String token = UUID.randomUUID().toString();
        User user = User.builder()
                .resetToken(token)
                .resetTokenExpiry(LocalDateTime.now().minusMinutes(1))
                .build();

        when(userRepository.findByResetToken(token)).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> authService.resetPassword(token, "pass"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("expirado");
    }

    // ── changePassword ───────────────────────────────────────────────────────

    @Test
    void changePassword_updatesPasswordWhenCurrentIsCorrect() {
        User user = User.builder()
                .email("u@test.com").password("oldEnc").build();

        when(userRepository.findByEmail("u@test.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("oldPass", "oldEnc")).thenReturn(true);
        when(passwordEncoder.encode("newPass")).thenReturn("newEnc");
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        authService.changePassword("u@test.com", "oldPass", "newPass");

        assertThat(user.getPassword()).isEqualTo("newEnc");
    }

    @Test
    void changePassword_throwsWhenCurrentPasswordIsWrong() {
        User user = User.builder()
                .email("u@test.com").password("oldEnc").build();

        when(userRepository.findByEmail("u@test.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrongPass", "oldEnc")).thenReturn(false);

        assertThatThrownBy(() -> authService.changePassword("u@test.com", "wrongPass", "newPass"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Senha atual incorreta");
    }
}
