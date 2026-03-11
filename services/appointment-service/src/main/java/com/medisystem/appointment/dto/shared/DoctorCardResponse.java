package com.medisystem.appointment.dto.shared;

import java.util.List;

public record DoctorCardResponse(
        Long id,
        String fullName,
        String specialty,
        Integer experienceYears,
        String photoUrl,
        String description,
        String branch,
        boolean published,
        List<DoctorPriceItem> prices,
        List<DoctorScheduleItem> schedules,
        List<DoctorCertificateItem> certificates,
        List<DoctorReviewItem> reviews
) {
}
