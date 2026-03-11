package com.medisystem.appointment.dto.shared;

import java.time.LocalDate;

public record DoctorCertificateItem(
        String title,
        String issuer,
        LocalDate issuedAt,
        String fileUrl
) {
}
