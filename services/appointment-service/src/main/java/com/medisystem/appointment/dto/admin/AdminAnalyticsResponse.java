package com.medisystem.appointment.dto.admin;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record AdminAnalyticsResponse(
        LocalDate fromDate,
        LocalDate toDate,
        Summary summary,
        List<DailyStat> appointmentsByDay,
        List<StatusStat> appointmentsByStatus,
        List<SpecialtyStat> specialtyBreakdown,
        List<DoctorLoadStat> doctorLoad,
        List<TopServiceStat> topServices
) {
    public record Summary(
            long totalAppointments,
            long scheduledAppointments,
            long completedAppointments,
            long cancelledAppointments,
            long uniquePatients,
            long activeDoctors,
            BigDecimal cancellationRate,
            BigDecimal totalRevenue
        ) {
    }

    public record DailyStat(
            LocalDate date,
            long totalAppointments,
            long scheduledAppointments,
            long completedAppointments,
            long cancelledAppointments
    ) {
    }

    public record StatusStat(
            String status,
            long count
    ) {
    }

    public record SpecialtyStat(
            String specialty,
            long count,
            BigDecimal sharePercent
    ) {
    }

    public record DoctorLoadStat(
            Long doctorId,
            String doctorName,
            String specialty,
            long totalAppointments,
            long scheduledAppointments,
            long completedAppointments,
            long cancelledAppointments,
            BigDecimal sharePercent
    ) {
    }

    public record TopServiceStat(
            String serviceName,
            long count,
            BigDecimal totalRevenue,
            BigDecimal sharePercent
    ) {
    }
}
