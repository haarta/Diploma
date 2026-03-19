package com.medisystem.notification.config;

public final class KafkaTopicsConfig {

    public static final String APPOINTMENT_CREATED_TOPIC = "appointment.created";
    public static final String APPOINTMENT_CANCELLED_TOPIC = "appointment.cancelled";
    public static final String APPOINTMENT_REMINDER_TOPIC = "appointment.reminder";

    private KafkaTopicsConfig() {
    }
}
