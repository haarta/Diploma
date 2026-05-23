package com.medisystem.auth.service;

import com.medisystem.auth.dto.TokenResponse;
import com.medisystem.auth.entity.RefreshToken;
import com.medisystem.auth.entity.Role;
import com.medisystem.auth.entity.UserAccount;
import com.medisystem.auth.repo.RefreshTokenRepository;
import com.medisystem.auth.repo.UserAccountRepository;
import com.medisystem.auth.security.JwtService;
import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserAccountRepository users;

    @Mock
    private RefreshTokenRepository refreshRepo;

    @Mock
    private PasswordEncoder encoder;

    @Mock
    private JwtService jwt;

    @InjectMocks
    private AuthService authService;

    @Test
    void registerShouldPersistNormalizedUserAndIssueTokens() {
        when(users.existsByEmailIgnoreCase("User@Example.com")).thenReturn(false);
        when(encoder.encode("password123")).thenReturn("hashed-password");
        when(users.save(any(UserAccount.class))).thenAnswer(invocation -> {
            UserAccount user = invocation.getArgument(0);
            ReflectionTestUtils.setField(user, "id", 5L);
            return user;
        });
        when(jwt.createAccessToken(anyLong(), anyString(), eq(Role.USER))).thenReturn("access-token");
        when(jwt.createRefreshToken(anyString(), anyLong())).thenReturn("refresh-token");
        when(refreshRepo.save(any(RefreshToken.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TokenResponse response = authService.register("User@Example.com", "password123");

        assertThat(response.accessToken).isEqualTo("access-token");
        assertThat(response.refreshToken).isEqualTo("refresh-token");

        ArgumentCaptor<UserAccount> userCaptor = ArgumentCaptor.forClass(UserAccount.class);
        verify(users).save(userCaptor.capture());
        assertThat(userCaptor.getValue().getEmail()).isEqualTo("user@example.com");
        assertThat(userCaptor.getValue().getPasswordHash()).isEqualTo("hashed-password");
        assertThat(userCaptor.getValue().getRole()).isEqualTo(Role.USER);

        verify(refreshRepo).save(any(RefreshToken.class));
    }

    @Test
    void registerShouldRejectDuplicateEmail() {
        when(users.existsByEmailIgnoreCase("taken@example.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register("taken@example.com", "password123"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Email already registered");
    }

    @Test
    void refreshShouldRotateStoredTokenAndIssueNewPair() {
        Claims claims = org.mockito.Mockito.mock(Claims.class);
        RefreshToken storedToken = new RefreshToken();
        storedToken.setJti("old-jti");
        storedToken.setUserId(7L);
        storedToken.setExpiresAt(Instant.now().plusSeconds(3600));
        storedToken.setRevoked(false);

        UserAccount user = new UserAccount();
        user.setEmail("doctor@example.com");
        user.setRole(Role.DOCTOR);
        ReflectionTestUtils.setField(user, "id", 7L);

        when(jwt.parseClaims("refresh-token")).thenReturn(claims);
        when(claims.get("typ", String.class)).thenReturn("refresh");
        when(claims.getId()).thenReturn("old-jti");
        when(claims.getSubject()).thenReturn("7");
        when(refreshRepo.findByJti("old-jti")).thenReturn(Optional.of(storedToken));
        when(users.findById(7L)).thenReturn(Optional.of(user));
        when(jwt.createAccessToken(anyLong(), anyString(), eq(Role.DOCTOR))).thenReturn("new-access-token");
        when(jwt.createRefreshToken(anyString(), eq(7L))).thenReturn("new-refresh-token");
        when(refreshRepo.save(any(RefreshToken.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TokenResponse response = authService.refresh("refresh-token");

        assertThat(response.accessToken).isEqualTo("new-access-token");
        assertThat(response.refreshToken).isEqualTo("new-refresh-token");
        assertThat(storedToken.isRevoked()).isTrue();
        verify(refreshRepo, times(2)).save(any(RefreshToken.class));
    }
}
