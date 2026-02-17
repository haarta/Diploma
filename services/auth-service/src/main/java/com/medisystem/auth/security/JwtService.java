package com.medisystem.auth.security;

import com.medisystem.auth.config.AuthProperties;
import com.medisystem.auth.entity.Role;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.Map;
import java.util.UUID;

@Service
public class JwtService {

    private final AuthProperties props;
    private final SecretKey key;

    public JwtService(AuthProperties props) {
        this.props = props;
        this.key = Keys.hmacShaKeyFor(props.getSecret().getBytes(StandardCharsets.UTF_8));
    }

    public String createAccessToken(long userId, String email, Role role) {
        Instant now = Instant.now();
        Instant exp = now.plusSeconds(props.getAccessTtlMinutes() * 60L);

        return Jwts.builder()
                .issuer(props.getIssuer())
                .subject(Long.toString(userId))
                .issuedAt(Date.from(now))
                .expiration(Date.from(exp))
                .claims(Map.of(
                        "email", email,
                        "role", role.name()
                ))
                .signWith(key)
                .compact();
    }

    public String createRefreshToken(String jti, long userId) {
        Instant now = Instant.now();
        Instant exp = now.plusSeconds(props.getRefreshTtlDays() * 24L * 3600L);

        return Jwts.builder()
                .issuer(props.getIssuer())
                .subject(Long.toString(userId))
                .id(jti)
                .issuedAt(Date.from(now))
                .expiration(Date.from(exp))
                .claim("typ", "refresh")
                .signWith(key)
                .compact();
    }

    public Claims parseClaims(String jwt) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(jwt)
                .getPayload();
    }

    public static String newJti() {
        return UUID.randomUUID().toString().replace("-", "");
    }
}
