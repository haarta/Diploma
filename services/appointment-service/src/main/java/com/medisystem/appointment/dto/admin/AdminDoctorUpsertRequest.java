package com.medisystem.appointment.dto.admin;

import com.medisystem.appointment.dto.shared.DoctorCertificateItem;
import com.medisystem.appointment.dto.shared.DoctorPriceItem;
import com.medisystem.appointment.dto.shared.DoctorScheduleItem;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

import java.util.List;

public record AdminDoctorUpsertRequest(
        @NotBlank String fullName,
        @NotBlank String specialty,
        Integer experienceYears,
        String photoUrl,
        String description,
        String branch,
        boolean published,
        @Valid List<DoctorPriceItem> prices,
        @Valid List<DoctorScheduleItem> schedules,
        @Valid List<DoctorCertificateItem> certificates
) {
}
