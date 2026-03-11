package com.medisystem.appointment.dto.publicapi;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record PublicReviewCreateRequest(
        @NotBlank String authorName,
        @Min(1) @Max(5) Integer rating,
        @NotBlank String text
) {
}
