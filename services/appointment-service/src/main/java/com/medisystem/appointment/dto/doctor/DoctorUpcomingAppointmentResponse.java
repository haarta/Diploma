package com.medisystem.appointment.dto.doctor;

import java.time.LocalDate;
import java.time.LocalTime;

public record DoctorUpcomingAppointmentResponse(
        Long id,
        Long patientId,
        Long doctorId,
        String patientFullName,
        String patientEmail,
        LocalDate appointmentDate,
        LocalTime appointmentTime,
        String status,
        String notes,
        String serviceName,
        String completionSummary
) {
}
