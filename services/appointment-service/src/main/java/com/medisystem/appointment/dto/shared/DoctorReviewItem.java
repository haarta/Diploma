package com.medisystem.appointment.dto.shared;

import java.time.OffsetDateTime;

public record DoctorReviewItem(
        Long id,
        Long doctorId,
        Long appointmentId,
        String authorName,
        Integer rating,
        String text,
        String status,
        OffsetDateTime createdAt
) {
}
