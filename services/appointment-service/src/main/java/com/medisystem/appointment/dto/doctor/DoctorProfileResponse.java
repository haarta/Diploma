package com.medisystem.appointment.dto.doctor;

public record DoctorProfileResponse(
        Long id,
        Long userId,
        String fullName,
        String specialty,
        Integer experienceYears,
        String photoUrl,
        String description,
        String branch,
        boolean published,
        int reviewCount,
        Double averageRating
) {
}
