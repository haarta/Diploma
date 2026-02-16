package com.medisystem.auth.dto;

public class TokenResponse {
    public String tokenType = "Bearer";
    public String accessToken;
    public String refreshToken;

    public TokenResponse(String accessToken, String refreshToken) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
    }
}
