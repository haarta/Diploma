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
import org.springframework.transaction.annotation.Transactional;

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
            throw new IllegalArgumentException("Пользователь с таким e-mail уже зарегистрирован");
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
                .orElseThrow(() -> new IllegalArgumentException("Неверный e-mail или пароль"));

        if (!u.isEnabled() || !encoder.matches(password, u.getPasswordHash())) {
            throw new IllegalArgumentException("Неверный e-mail или пароль");
        }

        return issueTokens(u);
    }

    public TokenResponse refresh(String refreshTokenJwt) {
        Claims c = jwt.parseClaims(refreshTokenJwt);

        String typ = c.get("typ", String.class);
        if (!"refresh".equals(typ)) throw new IllegalArgumentException("Передан некорректный токен обновления");

        String jti = c.getId();
        long userId = Long.parseLong(c.getSubject());

        RefreshToken stored = refreshRepo.findByJti(jti)
                .orElseThrow(() -> new IllegalArgumentException("Токен обновления не найден"));

        if (stored.isRevoked() || stored.getExpiresAt().isBefore(Instant.now())) {
            throw new IllegalArgumentException("Срок действия токена обновления истек или он был отозван");
        }

        // rotation: отзываем старый refresh
        stored.setRevoked(true);
        refreshRepo.save(stored);

        UserAccount u = users.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Пользователь не найден"));

        return issueTokens(u);
    }

    @Transactional
    public UserAccount updateMe(long userId, String email, String password) {
        UserAccount user = users.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Пользователь не найден"));

        if (email != null && !email.isBlank()) {
            String normalizedEmail = email.trim().toLowerCase();
            if (!normalizedEmail.equalsIgnoreCase(user.getEmail()) && users.existsByEmailIgnoreCase(normalizedEmail)) {
                throw new IllegalArgumentException("Пользователь с таким e-mail уже зарегистрирован");
            }
            user.setEmail(normalizedEmail);
        }

        if (password != null && !password.isBlank()) {
            user.setPasswordHash(encoder.encode(password));
        }

        return users.save(user);
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
