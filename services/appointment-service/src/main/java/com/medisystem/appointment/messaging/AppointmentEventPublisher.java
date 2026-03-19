package com.medisystem.appointment.messaging;

import com.medisystem.appointment.config.KafkaTopicsConfig;
import com.medisystem.appointment.entity.Appointment;
import com.medisystem.appointment.entity.Doctor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
public class AppointmentEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(AppointmentEventPublisher.class);

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public AppointmentEventPublisher(KafkaTemplate<String, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void publishCreated(Appointment appointment, Doctor doctor, String patientEmail, String patientFullName) {
        AppointmentCreatedEvent event = new AppointmentCreatedEvent(
                appointment.getId(),
                appointment.getDoctorId(),
                safeDoctorName(doctor),
                safeDoctorSpecialty(doctor),
                appointment.getPatientId(),
                appointment.getCreatedByUserId(),
                normalize(patientEmail),
                normalize(patientFullName),
                appointment.getAppointmentDate(),
                appointment.getAppointmentTime(),
                normalize(appointment.getServiceName()),
                appointment.getServicePrice(),
                normalize(appointment.getServiceCurrency()),
                normalize(appointment.getNotes())
        );
        kafkaTemplate.send(KafkaTopicsConfig.APPOINTMENT_CREATED_TOPIC, String.valueOf(appointment.getId()), event);
        log.info("Published appointment.created event for appointmentId={}", appointment.getId());
    }

    public void publishCancelled(Appointment appointment, Doctor doctor, String patientEmail, String patientFullName) {
        AppointmentCancelledEvent event = new AppointmentCancelledEvent(
                appointment.getId(),
                appointment.getDoctorId(),
                safeDoctorName(doctor),
                safeDoctorSpecialty(doctor),
                appointment.getPatientId(),
                appointment.getCreatedByUserId(),
                normalize(patientEmail),
                normalize(patientFullName),
                appointment.getAppointmentDate(),
                appointment.getAppointmentTime(),
                normalize(appointment.getServiceName())
        );
        kafkaTemplate.send(KafkaTopicsConfig.APPOINTMENT_CANCELLED_TOPIC, String.valueOf(appointment.getId()), event);
        log.info("Published appointment.cancelled event for appointmentId={}", appointment.getId());
    }

    public void publishReminder(Appointment appointment, Doctor doctor, String reminderType) {
        AppointmentReminderEvent event = new AppointmentReminderEvent(
                appointment.getId(),
                appointment.getDoctorId(),
                safeDoctorName(doctor),
                safeDoctorSpecialty(doctor),
                appointment.getPatientId(),
                appointment.getCreatedByUserId(),
                normalize(appointment.getPatientEmail()),
                normalize(appointment.getPatientFullName()),
                appointment.getAppointmentDate(),
                appointment.getAppointmentTime(),
                normalize(appointment.getServiceName()),
                normalize(reminderType)
        );
        kafkaTemplate.send(KafkaTopicsConfig.APPOINTMENT_REMINDER_TOPIC, String.valueOf(appointment.getId()), event);
        log.info("Published appointment.reminder event for appointmentId={} type={}", appointment.getId(), reminderType);
    }

    private String safeDoctorName(Doctor doctor) {
        if (doctor == null || doctor.getFullName() == null || doctor.getFullName().isBlank()) {
            return null;
        }
        return doctor.getFullName().trim();
    }

    private String safeDoctorSpecialty(Doctor doctor) {
        if (doctor == null || doctor.getSpecialty() == null || doctor.getSpecialty().isBlank()) {
            return null;
        }
        return doctor.getSpecialty().trim();
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
