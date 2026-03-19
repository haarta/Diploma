package com.medisystem.appointment.messaging;

import java.time.LocalDate;
import java.time.LocalTime;

public record AppointmentReminderEvent(
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
        String serviceName,
        String reminderType
) {
}
