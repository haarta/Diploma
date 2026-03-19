package com.medisystem.notification.messaging;

import com.medisystem.appointment.messaging.AppointmentCancelledEvent;
import com.medisystem.appointment.messaging.AppointmentCreatedEvent;
import com.medisystem.appointment.messaging.AppointmentReminderEvent;
import com.medisystem.notification.config.KafkaTopicsConfig;
import com.medisystem.notification.service.NotificationMailService;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class AppointmentNotificationConsumer {

    private final NotificationMailService notificationMailService;

    public AppointmentNotificationConsumer(NotificationMailService notificationMailService) {
        this.notificationMailService = notificationMailService;
    }

    @KafkaListener(topics = KafkaTopicsConfig.APPOINTMENT_CREATED_TOPIC, groupId = "${spring.kafka.consumer.group-id}")
    public void onAppointmentCreated(AppointmentCreatedEvent event) {
        notificationMailService.sendAppointmentCreatedEmail(event);
    }

    @KafkaListener(topics = KafkaTopicsConfig.APPOINTMENT_CANCELLED_TOPIC, groupId = "${spring.kafka.consumer.group-id}")
    public void onAppointmentCancelled(AppointmentCancelledEvent event) {
        notificationMailService.sendAppointmentCancelledEmail(event);
    }

    @KafkaListener(topics = KafkaTopicsConfig.APPOINTMENT_REMINDER_TOPIC, groupId = "${spring.kafka.consumer.group-id}")
    public void onAppointmentReminder(AppointmentReminderEvent event) {
        notificationMailService.sendAppointmentReminderEmail(event);
    }
}
