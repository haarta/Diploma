package com.medisystem.appointment.dto.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AdminNewsItemUpsertRequest(
        @NotBlank(message = "must not be blank")
        @Size(max = 255, message = "length must be <= 255")
        String title,

        @NotBlank(message = "must not be blank")
        String shortDescription,

        @Size(max = 120, message = "length must be <= 120")
        String category,

        String description,
        String imageUrl,
        Integer displayOrder,
        boolean published
) {
}
