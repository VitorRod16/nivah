package com.nivah.security;

import com.nivah.model.Role;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.*;

class JwtTokenProviderTest {

    private JwtTokenProvider provider;

    @BeforeEach
    void setUp() {
        provider = new JwtTokenProvider();
        ReflectionTestUtils.setField(provider, "jwtSecret",
                "NivahSecretKeyForJWTTokenGenerationThatIsLongEnoughForHS256Algorithm2024");
        ReflectionTestUtils.setField(provider, "jwtExpiration", 604800000L);
    }

    private UserDetails userOf(String email) {
        return User.withUsername(email).password("pass").authorities("ROLE_MEMBRO").build();
    }

    @Test
    void generateToken_returnsNonNullToken() {
        String token = provider.generateToken(userOf("user@test.com"), Role.MEMBRO);
        assertThat(token).isNotBlank();
    }

    @Test
    void extractUsername_returnsCorrectEmail() {
        String email = "joao@teste.com";
        String token = provider.generateToken(userOf(email), Role.PASTOR);
        assertThat(provider.extractUsername(token)).isEqualTo(email);
    }

    @Test
    void extractRole_returnsCorrectRole() {
        String token = provider.generateToken(userOf("admin@test.com"), Role.ADMIN);
        assertThat(provider.extractRole(token)).isEqualTo("ADMIN");
    }

    @Test
    void validateToken_returnsTrueForValidToken() {
        UserDetails user = userOf("valid@test.com");
        String token = provider.generateToken(user, Role.MEMBRO);
        assertThat(provider.validateToken(token, user)).isTrue();
    }

    @Test
    void validateToken_returnsFalseForDifferentUser() {
        String token = provider.generateToken(userOf("a@test.com"), Role.MEMBRO);
        UserDetails other = userOf("b@test.com");
        assertThat(provider.validateToken(token, other)).isFalse();
    }

    @Test
    void validateToken_returnsFalseForTamperedToken() {
        String token = provider.generateToken(userOf("x@test.com"), Role.MEMBRO) + "tampered";
        UserDetails user = userOf("x@test.com");
        assertThat(provider.validateToken(token, user)).isFalse();
    }

    @Test
    void validateToken_returnsFalseForExpiredToken() {
        ReflectionTestUtils.setField(provider, "jwtExpiration", -1000L);
        String token = provider.generateToken(userOf("exp@test.com"), Role.MEMBRO);
        ReflectionTestUtils.setField(provider, "jwtExpiration", 604800000L);
        UserDetails user = userOf("exp@test.com");
        assertThat(provider.validateToken(token, user)).isFalse();
    }

    @Test
    void generateToken_embeddingAllRoles() {
        for (Role role : Role.values()) {
            String token = provider.generateToken(userOf("u@test.com"), role);
            assertThat(provider.extractRole(token)).isEqualTo(role.name());
        }
    }
}
