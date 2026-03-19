package com.medisystem.appointment.dto.doctor;

import java.time.OffsetDateTime;

public record PatientDocumentResponse(
        Long id,
        Long appointmentId,
        String documentType,
        String fileName,
        String fileUrl,
        OffsetDateTime createdAt
) {
}
