package com.medisystem.appointment.dto.shared;

import jakarta.validation.constraints.NotBlank;

public record DoctorScheduleItem(
        @NotBlank String dayOfWeek,
        @NotBlank String startTime,
        @NotBlank String endTime
) {
}
