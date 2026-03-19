package com.medisystem.notification.service;

import com.medisystem.appointment.messaging.AppointmentCancelledEvent;
import com.medisystem.appointment.messaging.AppointmentCreatedEvent;
import com.medisystem.appointment.messaging.AppointmentReminderEvent;
import com.medisystem.notification.config.MailConfig.ResolvedMailSettings;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class NotificationMailService {

    private static final Logger log = LoggerFactory.getLogger(NotificationMailService.class);

    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final ResolvedMailSettings mailSettings;

    public NotificationMailService(ObjectProvider<JavaMailSender> mailSenderProvider, ResolvedMailSettings mailSettings) {
        this.mailSenderProvider = mailSenderProvider;
        this.mailSettings = mailSettings;
    }

    public void sendAppointmentCreatedEmail(AppointmentCreatedEvent event) {
        if (event.patientEmail() == null || event.patientEmail().isBlank()) {
            return;
        }

        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            log.info("Skipping appointment created email notification because mail sender is not configured");
            return;
        }

        SimpleMailMessage message = baseMessage(event.patientEmail().trim(), "Подтверждение записи на прием");
        message.setText("""
                Здравствуйте, %s!

                Ваша запись успешно создана.

                Врач: %s%s
                Услуга: %s
                Дата: %s
                Время: %s

                Если вам потребуется изменить запись, пожалуйста, свяжитесь с клиникой.
                """.formatted(
                safePatientName(event.patientFullName()),
                safeDoctorName(event.doctorName()),
                safeSpecialty(event.doctorSpecialty()),
                safeServiceName(event.serviceName()),
                event.appointmentDate(),
                event.appointmentTime()
        ));

        try {
            mailSender.send(message);
        } catch (Exception ex) {
            log.warn("Failed to send appointment created email notification to {}", event.patientEmail(), ex);
        }
    }

    public void sendAppointmentCancelledEmail(AppointmentCancelledEvent event) {
        if (event.patientEmail() == null || event.patientEmail().isBlank()) {
            return;
        }

        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            log.info("Skipping appointment cancelled email notification because mail sender is not configured");
            return;
        }

        SimpleMailMessage message = baseMessage(event.patientEmail().trim(), "Отмена записи на прием");
        message.setText("""
                Здравствуйте, %s!

                Ваша запись отменена.

                Врач: %s%s
                Услуга: %s
                Дата: %s
                Время: %s

                При необходимости вы можете оформить новую запись в личном кабинете.
                """.formatted(
                safePatientName(event.patientFullName()),
                safeDoctorName(event.doctorName()),
                safeSpecialty(event.doctorSpecialty()),
                safeServiceName(event.serviceName()),
                event.appointmentDate(),
                event.appointmentTime()
        ));

        try {
            mailSender.send(message);
        } catch (Exception ex) {
            log.warn("Failed to send appointment cancelled email notification to {}", event.patientEmail(), ex);
        }
    }

    public void sendAppointmentReminderEmail(AppointmentReminderEvent event) {
        if (event.patientEmail() == null || event.patientEmail().isBlank()) {
            return;
        }

        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            log.info("Skipping appointment reminder email notification because mail sender is not configured");
            return;
        }

        String subject = "REMINDER_2H".equalsIgnoreCase(event.reminderType())
                ? "Напоминание о приёме через 2 часа"
                : "Напоминание о приёме";
        String lead = "REMINDER_2H".equalsIgnoreCase(event.reminderType())
                ? "Напоминаем, что ваш приём начнётся в ближайшие 2 часа."
                : "Напоминаем о предстоящем приёме.";

        SimpleMailMessage message = baseMessage(event.patientEmail().trim(), subject);
        message.setText("""
                Здравствуйте, %s!

                %s

                Врач: %s%s
                Услуга: %s
                Дата: %s
                Время: %s
                """.formatted(
                safePatientName(event.patientFullName()),
                lead,
                safeDoctorName(event.doctorName()),
                safeSpecialty(event.doctorSpecialty()),
                safeServiceName(event.serviceName()),
                event.appointmentDate(),
                event.appointmentTime()
        ));

        try {
            mailSender.send(message);
        } catch (Exception ex) {
            log.warn("Failed to send appointment reminder email notification to {}", event.patientEmail(), ex);
        }
    }

    private SimpleMailMessage baseMessage(String to, String subject) {
        SimpleMailMessage message = new SimpleMailMessage();
        if (!mailSettings.from().isBlank()) {
            message.setFrom(mailSettings.from());
        } else if (!mailSettings.username().isBlank()) {
            message.setFrom(mailSettings.username());
        }
        message.setTo(to);
        message.setSubject(subject);
        return message;
    }

    private String safePatientName(String value) {
        return value == null || value.isBlank() ? "пациент" : value.trim();
    }

    private String safeDoctorName(String value) {
        return value == null || value.isBlank() ? "специалист клиники" : value.trim();
    }

    private String safeServiceName(String value) {
        return value == null || value.isBlank() ? "Консультация" : value.trim();
    }

    private String safeSpecialty(String value) {
        return value == null || value.isBlank() ? "" : " (" + value.trim() + ")";
    }
}
