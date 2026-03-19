package com.medisystem.appointment.dto;

import java.time.OffsetDateTime;

public record UserNotificationResponse(
        Long id,
        Long appointmentId,
        String type,
        String title,
        String message,
        String linkPath,
        boolean read,
        OffsetDateTime createdAt,
        OffsetDateTime readAt
) {
}
