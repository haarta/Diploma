package com.medisystem.appointment.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;

public record AppointmentResponse(
        Long id,
        Long patientId,
        String patientFullName,
        String patientEmail,
        Long doctorId,
        LocalDate appointmentDate,
        LocalTime appointmentTime,
        String serviceName,
        BigDecimal servicePrice,
        String serviceCurrency,
        String status,
        String notes,
        String completionSummary,
        OffsetDateTime completedAt
) {
}
