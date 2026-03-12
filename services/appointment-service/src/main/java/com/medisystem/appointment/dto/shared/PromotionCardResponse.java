package com.medisystem.appointment.dto.shared;

import java.time.LocalDate;

public record PromotionCardResponse(
        Long id,
        String title,
        String shortDescription,
        String description,
        String imageUrl,
        String buttonText,
        String buttonLink,
        LocalDate activeFrom,
        LocalDate activeTo,
        boolean published
) {
}
