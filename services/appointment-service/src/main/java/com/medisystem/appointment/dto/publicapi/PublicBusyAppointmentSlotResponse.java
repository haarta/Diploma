package com.medisystem.appointment.dto.publicapi;

import java.time.LocalDate;
import java.time.LocalTime;

public record PublicBusyAppointmentSlotResponse(
        LocalDate appointmentDate,
        LocalTime appointmentTime,
        String status
) {
}
