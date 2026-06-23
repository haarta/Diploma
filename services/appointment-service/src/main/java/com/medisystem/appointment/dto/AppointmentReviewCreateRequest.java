package com.medisystem.appointment.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AppointmentReviewCreateRequest(
        @Min(1) @Max(5) Integer rating,
        @NotBlank @Size(max = 2000) String text
) {
}
