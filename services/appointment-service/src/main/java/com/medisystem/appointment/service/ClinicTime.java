package com.medisystem.appointment.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;

public final class ClinicTime {

    public static final ZoneId ZONE = ZoneId.of("Europe/Moscow");

    private ClinicTime() {
    }

    public static LocalDate today() {
        return LocalDate.now(ZONE);
    }

    public static LocalDateTime nowDateTime() {
        return LocalDateTime.now(ZONE);
    }

    public static OffsetDateTime nowOffset() {
        return OffsetDateTime.now(ZONE);
    }
}
