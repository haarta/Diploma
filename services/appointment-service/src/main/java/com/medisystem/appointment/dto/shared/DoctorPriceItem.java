package com.medisystem.appointment.dto.shared;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record DoctorPriceItem(
        @NotBlank String serviceName,
        @NotNull BigDecimal amount,
        String currency
) {
}
