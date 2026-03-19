package com.medisystem.appointment.service;

import com.medisystem.appointment.entity.Appointment;
import com.medisystem.appointment.entity.AppointmentStatus;
import com.medisystem.appointment.entity.Doctor;
import com.medisystem.appointment.entity.LabResult;
import com.medisystem.appointment.entity.LabResultStatus;
import com.medisystem.appointment.messaging.AppointmentEventPublisher;
import com.medisystem.appointment.repo.AppointmentRepository;
import com.medisystem.appointment.repo.DoctorRepository;
import com.medisystem.appointment.repo.LabResultRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AppointmentReminderScheduler {

    private static final Set<AppointmentStatus> ACTIVE_STATUSES = Set.of(
            AppointmentStatus.SCHEDULED,
            AppointmentStatus.CONFIRMED
    );

    private final AppointmentRepository appointmentRepository;
    private final DoctorRepository doctorRepository;
    private final AppointmentEventPublisher appointmentEventPublisher;
    private final UserNotificationService userNotificationService;
    private final LabResultRepository labResultRepository;

    public AppointmentReminderScheduler(
            AppointmentRepository appointmentRepository,
            DoctorRepository doctorRepository,
            AppointmentEventPublisher appointmentEventPublisher,
            UserNotificationService userNotificationService,
            LabResultRepository labResultRepository
    ) {
        this.appointmentRepository = appointmentRepository;
        this.doctorRepository = doctorRepository;
        this.appointmentEventPublisher = appointmentEventPublisher;
        this.userNotificationService = userNotificationService;
        this.labResultRepository = labResultRepository;
    }

    @Scheduled(fixedDelayString = "${app.scheduling.reminders-delay-ms:300000}")
    @Transactional
    public void publishDueReminders() {
        LocalDate today = LocalDate.now();
        LocalDate targetDate = today.plusDays(2);
        List<Appointment> appointments = appointmentRepository
                .findAllByAppointmentDateBetweenAndStatusInOrderByAppointmentDateAscAppointmentTimeAsc(
                        today,
                        targetDate,
                        List.copyOf(ACTIVE_STATUSES)
                );

        Map<Long, Doctor> doctorsById = doctorRepository.findAllById(
                        appointments.stream().map(Appointment::getDoctorId).collect(Collectors.toSet())
                ).stream()
                .collect(Collectors.toMap(Doctor::getId, item -> item));

        OffsetDateTime now = OffsetDateTime.now();
        for (Appointment appointment : appointments) {
            if (appointment.getCreatedByUserId() == null || appointment.getPatientEmail() == null || appointment.getPatientEmail().isBlank()) {
                continue;
            }

            LocalDateTime appointmentDateTime = LocalDateTime.of(appointment.getAppointmentDate(), appointment.getAppointmentTime());
            long minutesUntil = Duration.between(now.toLocalDateTime(), appointmentDateTime).toMinutes();
            if (minutesUntil <= 0) {
                continue;
            }

            Doctor doctor = doctorsById.get(appointment.getDoctorId());
            if (minutesUntil <= 24 * 60 && appointment.getReminder24hSentAt() == null) {
                appointmentEventPublisher.publishReminder(appointment, doctor, "REMINDER_24H");
                appointment.setReminder24hSentAt(now);
                userNotificationService.createNotification(
                        appointment.getCreatedByUserId(),
                        appointment.getId(),
                        "REMINDER",
                        "Напоминание о приёме завтра",
                        "Напоминаем о приёме " + appointment.getAppointmentDate() + " в " + appointment.getAppointmentTime() + ".",
                        "/cabinet/services"
                );
            }

            if (minutesUntil <= 120 && appointment.getReminder2hSentAt() == null) {
                appointmentEventPublisher.publishReminder(appointment, doctor, "REMINDER_2H");
                appointment.setReminder2hSentAt(now);
                userNotificationService.createNotification(
                        appointment.getCreatedByUserId(),
                        appointment.getId(),
                        "REMINDER",
                        "Напоминание о приёме через 2 часа",
                        "Приём начнётся в ближайшие 2 часа. Проверьте дату и время визита.",
                        "/cabinet/services"
                );
            }
        }
        appointmentRepository.saveAll(appointments);
    }

    @Scheduled(fixedDelayString = "${app.scheduling.lab-results-delay-ms:600000}")
    @Transactional
    public void finalizeLabResults() {
        OffsetDateTime now = OffsetDateTime.now();
        List<LabResult> dueResults = labResultRepository.findAll().stream()
                .filter(item -> item.getStatus() == LabResultStatus.PROCESSING)
                .filter(item -> item.getReadyAt() != null)
                .filter(item -> item.getReadyAt().atZone(ZoneId.systemDefault()).toOffsetDateTime().isBefore(now)
                        || item.getReadyAt().atZone(ZoneId.systemDefault()).toOffsetDateTime().isEqual(now))
                .toList();

        for (LabResult result : dueResults) {
            result.setStatus(LabResultStatus.READY);
            userNotificationService.createNotification(
                    result.getUserId(),
                    null,
                    "LAB_RESULT",
                    "Результат анализа готов",
                    "Результат \"" + result.getTitle() + "\" теперь доступен в личном кабинете.",
                    "/cabinet/labs"
            );
        }
        labResultRepository.saveAll(dueResults);
    }
}
