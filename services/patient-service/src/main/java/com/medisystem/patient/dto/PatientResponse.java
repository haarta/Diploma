package com.medisystem.patient.dto;

import java.time.LocalDate;

public record PatientResponse(
        Long id,
        Long userId,
        String fullName,
        LocalDate birthDate,
        String phone
) {}