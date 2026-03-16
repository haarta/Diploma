package com.medisystem.appointment.dto;

import com.medisystem.appointment.entity.AppointmentStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;

public record AppointmentCreateRequest(
        @NotNull Long patientId,
        @NotNull Long doctorId,
        @NotNull LocalDate appointmentDate,
        @NotNull LocalTime appointmentTime,
        AppointmentStatus status,
        String notes,
        String patientFullName,
        @NotBlank @Email String patientEmail
) {
}
