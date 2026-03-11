package com.medisystem.appointment.dto;

import jakarta.validation.constraints.NotBlank;

public record DoctorUpdateRequest(
        @NotBlank String firstName,
        @NotBlank String lastName,
        @NotBlank String specialty,
        String phone,
        String email,
        String licenseNumber
) {
}
