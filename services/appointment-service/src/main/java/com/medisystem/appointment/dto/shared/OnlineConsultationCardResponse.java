package com.medisystem.appointment.dto.shared;

public record OnlineConsultationCardResponse(
        Long id,
        String title,
        String shortDescription,
        String description,
        String imageUrl,
        String buttonText,
        String buttonLink,
        int displayOrder,
        boolean published
) {
}
