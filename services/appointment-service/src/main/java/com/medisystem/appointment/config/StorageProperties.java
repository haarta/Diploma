package com.medisystem.appointment.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "storage.minio")
public record StorageProperties(
        String endpoint,
        String publicUrl,
        String accessKey,
        String secretKey,
        String bucket,
        boolean publicRead
) {
}
