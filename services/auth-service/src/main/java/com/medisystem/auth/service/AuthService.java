package com.medisystem.auth.service;

import com.medisystem.auth.dto.TokenResponse;
import com.medisystem.auth.entity.RefreshToken;
import com.medisystem.auth.entity.Role;
import com.medisystem.auth.entity.UserAccount;
import com.medisystem.auth.repo.RefreshTokenRepository;
import com.medisystem.auth.repo.UserAccountRepository;
import com.medisystem.auth.security.JwtService;
import io.jsonwebtoken.Claims;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
public class AuthService {
    private final UserAccountRepository users;
    private final RefreshTokenRepository refreshRepo;
    private final PasswordEncoder encoder;
    private final JwtService jwt;

    public AuthService(UserAccountRepository users, RefreshTokenRepository refreshRepo,
                       PasswordEncoder encoder, JwtService jwt) {
        this.users = users;
        this.refreshRepo = refreshRepo;
        this.encoder = encoder;
        this.jwt = jwt;
    }

    public TokenResponse register(String email, String password) {
        if (users.existsByEmailIgnoreCase(email)) {
            throw new IllegalArgumentException("Email already registered");
        }

        UserAccount u = new UserAccount();
        u.setEmail(email.toLowerCase());
        u.setPasswordHash(encoder.encode(password));
        u.setRole(Role.USER);

        u = users.save(u);
        return issueTokens(u);
    }

    public TokenResponse login(String email, String password) {
        UserAccount u = users.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));

        if (!u.isEnabled() || !encoder.matches(password, u.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid credentials");
        }

        return issueTokens(u);
    }

    public TokenResponse refresh(String refreshTokenJwt) {
        Claims c = jwt.parseClaims(refreshTokenJwt);

        String typ = c.get("typ", String.class);
        if (!"refresh".equals(typ)) throw new IllegalArgumentException("Not a refresh token");

        String jti = c.getId();
        long userId = Long.parseLong(c.getSubject());

        RefreshToken stored = refreshRepo.findByJti(jti)
                .orElseThrow(() -> new IllegalArgumentException("Refresh token not found"));

        if (stored.isRevoked() || stored.getExpiresAt().isBefore(Instant.now())) {
            throw new IllegalArgumentException("Refresh token expired or revoked");
        }

        // rotation: отзываем старый refresh
        stored.setRevoked(true);
        refreshRepo.save(stored);

        UserAccount u = users.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        return issueTokens(u);
    }

    private TokenResponse issueTokens(UserAccount u) {
        String access = jwt.createAccessToken(u.getId(), u.getEmail(), u.getRole());

        String jti = JwtService.newJti();
        String refreshJwt = jwt.createRefreshToken(jti, u.getId());

        RefreshToken rt = new RefreshToken();
        rt.setJti(jti);
        rt.setUserId(u.getId());
        rt.setExpiresAt(Instant.now().plusSeconds(14L * 24 * 3600)); // можно брать из props, но ок для старта
        rt.setRevoked(false);

        refreshRepo.save(rt);

        return new TokenResponse(access, refreshJwt);
    }
}
