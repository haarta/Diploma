package com.medisystem.appointment.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "auth.jwt")
public record AuthProperties(String secret) {
}
