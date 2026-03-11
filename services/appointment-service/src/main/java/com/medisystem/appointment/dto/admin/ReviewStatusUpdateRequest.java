package com.medisystem.appointment.dto.admin;

import com.medisystem.appointment.entity.ReviewStatus;
import jakarta.validation.constraints.NotNull;

public record ReviewStatusUpdateRequest(
        @NotNull ReviewStatus status
) {
}
