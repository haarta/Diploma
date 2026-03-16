package com.medisystem.appointment.service;

import com.medisystem.appointment.config.MailConfig.ResolvedMailSettings;
import com.medisystem.appointment.entity.Appointment;
import com.medisystem.appointment.entity.Doctor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class AppointmentNotificationService {

    private static final Logger log = LoggerFactory.getLogger(AppointmentNotificationService.class);

    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final ResolvedMailSettings mailSettings;

    public AppointmentNotificationService(
            ObjectProvider<JavaMailSender> mailSenderProvider,
            ResolvedMailSettings mailSettings
    ) {
        this.mailSenderProvider = mailSenderProvider;
        this.mailSettings = mailSettings;
    }

    public void sendAppointmentCreatedEmail(
            Appointment appointment,
            Doctor doctor,
            String patientEmail,
            String patientFullName
    ) {
        if (patientEmail == null || patientEmail.isBlank()) {
            return;
        }

        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            log.info("Skipping appointment email notification because mail sender is not configured");
            return;
        }

        SimpleMailMessage message = new SimpleMailMessage();
        if (!mailSettings.from().isBlank()) {
            message.setFrom(mailSettings.from());
        } else if (!mailSettings.username().isBlank()) {
            message.setFrom(mailSettings.username());
        }
        message.setTo(patientEmail.trim());
        message.setSubject("Подтверждение записи на прием");
        message.setText(buildMessageBody(appointment, doctor, patientFullName));

        try {
            mailSender.send(message);
        } catch (Exception ex) {
            log.warn("Failed to send appointment email notification to {}", patientEmail, ex);
        }
    }

    private String buildMessageBody(Appointment appointment, Doctor doctor, String patientFullName) {
        String safePatientName = patientFullName == null || patientFullName.isBlank() ? "пациент" : patientFullName.trim();
        String safeDoctorName = doctor == null || doctor.getFullName() == null || doctor.getFullName().isBlank()
                ? "специалист клиники"
                : doctor.getFullName().trim();
        String safeSpecialty = doctor == null || doctor.getSpecialty() == null || doctor.getSpecialty().isBlank()
                ? ""
                : " (" + doctor.getSpecialty().trim() + ")";

        return """
                Здравствуйте, %s!

                Ваша запись успешно создана.

                Врач: %s%s
                Дата: %s
                Время: %s

                Если вам потребуется изменить запись, пожалуйста, свяжитесь с клиникой.
                """.formatted(
                safePatientName,
                safeDoctorName,
                safeSpecialty,
                appointment.getAppointmentDate(),
                appointment.getAppointmentTime()
        );
    }
}
