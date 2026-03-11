package com.medisystem.appointment.dto;

import com.medisystem.appointment.entity.AppointmentStatus;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;

public record AppointmentUpdateRequest(
        @NotNull Long patientId,
        @NotNull Long doctorId,
        @NotNull LocalDate appointmentDate,
        @NotNull LocalTime appointmentTime,
        @NotNull AppointmentStatus status,
        String notes
) {
}
