package com.medisystem.appointment.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaTopicsConfig {

    public static final String APPOINTMENT_CREATED_TOPIC = "appointment.created";
    public static final String APPOINTMENT_CANCELLED_TOPIC = "appointment.cancelled";
    public static final String APPOINTMENT_REMINDER_TOPIC = "appointment.reminder";

    @Bean
    public NewTopic appointmentCreatedTopic() {
        return TopicBuilder.name(APPOINTMENT_CREATED_TOPIC)
                .partitions(1)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic appointmentCancelledTopic() {
        return TopicBuilder.name(APPOINTMENT_CANCELLED_TOPIC)
                .partitions(1)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic appointmentReminderTopic() {
        return TopicBuilder.name(APPOINTMENT_REMINDER_TOPIC)
                .partitions(1)
                .replicas(1)
                .build();
    }
}
