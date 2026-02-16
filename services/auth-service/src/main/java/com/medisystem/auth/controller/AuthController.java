package com.medisystem.auth.controller;

import com.medisystem.auth.dto.*;
import com.medisystem.auth.security.UserPrincipal;
import com.medisystem.auth.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService auth;

    public AuthController(AuthService auth) {
        this.auth = auth;
    }

    @PostMapping("/register")
    public TokenResponse register(@RequestBody @Valid RegisterRequest req) {
        return auth.register(req.email, req.password);
    }

    @PostMapping("/login")
    public TokenResponse login(@RequestBody @Valid LoginRequest req) {
        return auth.login(req.email, req.password);
    }

    @PostMapping("/refresh")
    public TokenResponse refresh(@RequestBody @Valid RefreshRequest req) {
        return auth.refresh(req.refreshToken);
    }

    @GetMapping("/me")
    public MeResponse me(@AuthenticationPrincipal UserPrincipal principal) {
        return new MeResponse(principal.getUserId(), principal.getUsername(), principal.getRole());
    }
}
