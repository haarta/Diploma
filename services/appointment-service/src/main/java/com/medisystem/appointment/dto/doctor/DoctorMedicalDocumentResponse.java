package com.medisystem.appointment.dto.doctor;

import java.time.OffsetDateTime;

public record DoctorMedicalDocumentResponse(
        Long id,
        Long doctorId,
        Long patientId,
        Long appointmentId,
        String documentType,
        String fileName,
        String contentType,
        long fileSize,
        String fileKey,
        String fileUrl,
        OffsetDateTime createdAt
) {
}
