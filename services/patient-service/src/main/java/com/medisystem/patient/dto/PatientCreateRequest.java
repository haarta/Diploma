package com.medisystem.patient.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public class PatientCreateRequest {

    public Long userId;

    @NotBlank
    @Size(max = 255)
    public String fullName;

    public LocalDate birthDate;

    @Pattern(regexp = "^[+0-9()\\-\\s]{5,32}$", message = "phone has invalid format")
    public String phone;

    @Email
    @Size(max = 255)
    public String email;

    @Size(max = 32)
    public String gender;

    @Size(max = 500)
    public String address;

    @Size(max = 2000)
    public String allergies;

    @Size(max = 2000)
    public String chronicConditions;

    @Size(max = 3)
    public String bloodGroup;

    @Size(max = 8)
    public String rhFactor;

    @Max(value = 300, message = "heightCm must be less than or equal to 300")
    public Integer heightCm;

    @DecimalMin(value = "1.0", message = "weightKg must be greater than or equal to 1.0")
    @DecimalMax(value = "500.0", message = "weightKg must be less than or equal to 500.0")
    public BigDecimal weightKg;

    @Size(max = 255)
    public String emergencyContactName;

    @Pattern(regexp = "^[+0-9()\\-\\s]{5,32}$", message = "emergencyContactPhone has invalid format")
    public String emergencyContactPhone;
}
