package com.medisystem.patient.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public class PatientUpdateRequest {
    public Long userId;

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

    @Size(max = 255)
    public String emergencyContactName;

    @Pattern(regexp = "^[+0-9()\\-\\s]{5,32}$", message = "emergencyContactPhone has invalid format")
    public String emergencyContactPhone;
}
