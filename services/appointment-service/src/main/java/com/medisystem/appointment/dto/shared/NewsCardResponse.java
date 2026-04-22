package com.medisystem.appointment.dto.shared;

import java.time.LocalDateTime;

public record NewsCardResponse(
        Long id,
        String title,
        String shortDescription,
        String category,
        String description,
        String imageUrl,
        int displayOrder,
        boolean published,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
