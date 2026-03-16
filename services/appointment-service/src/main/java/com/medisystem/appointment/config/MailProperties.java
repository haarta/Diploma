package com.medisystem.appointment.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.mail")
public record MailProperties(
        String provider,
        String host,
        Integer port,
        String username,
        String password,
        String from,
        Boolean smtpAuth,
        Boolean starttlsEnable
) {
}
