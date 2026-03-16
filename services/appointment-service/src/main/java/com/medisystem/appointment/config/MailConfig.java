package com.medisystem.appointment.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import java.util.Locale;
import java.util.Properties;

@Configuration
public class MailConfig {

    @Bean
    public ResolvedMailSettings resolvedMailSettings(MailProperties mailProperties) {
        return resolveSettings(mailProperties);
    }

    @Bean
    public JavaMailSender javaMailSender(ResolvedMailSettings settings) {
        if (settings.host().isBlank() || settings.username().isBlank() || settings.password().isBlank()) {
            return null;
        }

        JavaMailSenderImpl sender = new JavaMailSenderImpl();
        sender.setHost(settings.host());
        sender.setPort(settings.port());
        sender.setUsername(settings.username());
        sender.setPassword(settings.password());
        sender.setDefaultEncoding("UTF-8");

        Properties props = sender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", Boolean.toString(settings.smtpAuth()));
        props.put("mail.smtp.starttls.enable", Boolean.toString(settings.starttlsEnable()));
        props.put("mail.debug", "false");

        return sender;
    }

    private ResolvedMailSettings resolveSettings(MailProperties mailProperties) {
        String provider = normalize(mailProperties.provider());
        String host = trim(mailProperties.host());
        Integer port = mailProperties.port();
        boolean smtpAuth = mailProperties.smtpAuth() == null || mailProperties.smtpAuth();
        boolean starttlsEnable = mailProperties.starttlsEnable() == null || mailProperties.starttlsEnable();

        if (host.isBlank()) {
            switch (provider) {
                case "gmail" -> {
                    host = "smtp.gmail.com";
                    port = withDefault(port, 587);
                    starttlsEnable = true;
                }
                case "mailru" -> {
                    host = "smtp.mail.ru";
                    port = withDefault(port, 587);
                    starttlsEnable = true;
                }
                case "yandex" -> {
                    host = "smtp.yandex.ru";
                    port = withDefault(port, 465);
                    starttlsEnable = port != null && port == 587;
                }
                default -> port = withDefault(port, 587);
            }
        } else {
            port = withDefault(port, 587);
        }

        return new ResolvedMailSettings(
                provider,
                host,
                port,
                trim(mailProperties.username()),
                trim(mailProperties.password()),
                trim(mailProperties.from()),
                smtpAuth,
                starttlsEnable
        );
    }

    private int withDefault(Integer value, int fallback) {
        return value == null || value <= 0 ? fallback : value;
    }

    private String normalize(String value) {
        return trim(value).toLowerCase(Locale.ROOT);
    }

    private String trim(String value) {
        return value == null ? "" : value.trim();
    }

    public record ResolvedMailSettings(
            String provider,
            String host,
            int port,
            String username,
            String password,
            String from,
            boolean smtpAuth,
            boolean starttlsEnable
    ) {
    }
}
