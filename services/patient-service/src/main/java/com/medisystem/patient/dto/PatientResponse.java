package com.medisystem.patient.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public record PatientResponse(
        Long id,
        Long userId,
        String fullName,
        LocalDate birthDate,
        String phone,
        String email,
        String gender,
        String address,
        String allergies,
        String chronicConditions,
        String bloodGroup,
        String rhFactor,
        Integer heightCm,
        BigDecimal weightKg,
        String emergencyContactName,
        String emergencyContactPhone,
        boolean active,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
}
