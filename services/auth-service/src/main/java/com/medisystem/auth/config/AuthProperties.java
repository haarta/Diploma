package com.medisystem.auth.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "auth.jwt")
public class AuthProperties {
    private String secret;
    private long accessTtlMinutes;
    private long refreshTtlDays;
    private String issuer;

    public String getSecret() { return secret; }
    public long getAccessTtlMinutes() { return accessTtlMinutes; }
    public long getRefreshTtlDays() { return refreshTtlDays; }
    public String getIssuer() { return issuer; }

    public void setSecret(String secret) { this.secret = secret; }
    public void setAccessTtlMinutes(long accessTtlMinutes) { this.accessTtlMinutes = accessTtlMinutes; }
    public void setRefreshTtlDays(long refreshTtlDays) { this.refreshTtlDays = refreshTtlDays; }
    public void setIssuer(String issuer) { this.issuer = issuer; }
}
