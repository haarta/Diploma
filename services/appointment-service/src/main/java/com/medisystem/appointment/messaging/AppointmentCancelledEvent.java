package com.medisystem.appointment.messaging;

import java.time.LocalDate;
import java.time.LocalTime;

public record AppointmentCancelledEvent(
        Long appointmentId,
        Long doctorId,
        String doctorName,
        String doctorSpecialty,
        Long patientId,
        Long createdByUserId,
        String patientEmail,
        String patientFullName,
        LocalDate appointmentDate,
        LocalTime appointmentTime,
        String serviceName
) {
}
