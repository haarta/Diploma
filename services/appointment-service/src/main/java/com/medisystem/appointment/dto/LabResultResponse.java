package com.medisystem.appointment.dto;

import java.time.LocalDateTime;

public record LabResultResponse(
        Long id,
        String title,
        String category,
        LocalDateTime orderedAt,
        LocalDateTime readyAt,
        String status,
        String pdfUrl
) {
}
