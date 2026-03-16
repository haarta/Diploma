package com.medisystem.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class DoctorVerificationSubmitRequest {
    @NotBlank
    @Size(max = 255)
    public String fullName;

    @NotBlank
    @Size(max = 255)
    public String specialty;

    @Size(max = 255)
    public String licenseNumber;

    @NotBlank
    @Size(max = 4000)
    public String licenseFileUrl;

    @NotBlank
    @Size(max = 4000)
    public String diplomaFileUrl;

    @NotBlank
    @Size(max = 4000)
    public String specialtyCertificateFileUrl;

    @Size(max = 4000)
    public String identityDocumentFileUrl;
}
