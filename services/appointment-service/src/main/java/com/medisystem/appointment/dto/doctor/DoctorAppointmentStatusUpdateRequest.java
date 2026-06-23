package com.medisystem.appointment.dto.doctor;

import jakarta.validation.constraints.NotBlank;

public record DoctorAppointmentStatusUpdateRequest(
        @NotBlank String status,
        String completionSummary,
        String complaints,
        String anamnesis,
        String objectiveFindings,
        String diagnosis,
        String prescriptions,
        String treatmentPlan
) {
}
