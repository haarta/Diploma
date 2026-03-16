package com.medisystem.auth.dto;

import java.time.OffsetDateTime;

public record DoctorVerificationApplicationResponse(
        Long id,
        Long userId,
        String email,
        String fullName,
        String specialty,
        String licenseNumber,
        String licenseFileUrl,
        String diplomaFileUrl,
        String specialtyCertificateFileUrl,
        String identityDocumentFileUrl,
        String status,
        String reviewComment,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
}
