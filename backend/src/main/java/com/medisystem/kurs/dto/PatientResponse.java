package com.medisystem.kurs.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PatientResponse {
    private Long id;
    private String fullName;
    private String phoneNumber;
    private String dateOfBirth;
    private String medicalHistory;
    private String createdAt;
}
