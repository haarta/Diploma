package com.medisystem.appointment.dto.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record AdminPromotionUpsertRequest(
        @NotBlank(message = "Поле обязательно для заполнения")
        @Size(max = 255, message = "length must be <= 255")
        String title,

        @NotBlank(message = "Поле обязательно для заполнения")
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
