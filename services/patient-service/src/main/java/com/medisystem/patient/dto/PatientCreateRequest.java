package com.medisystem.patient.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;

public class PatientCreateRequest {

    // временно даём руками, потом будет из JWT
    public Long userId;

    @NotBlank
    public String fullName;

    public LocalDate birthDate;

    public String phone;
}