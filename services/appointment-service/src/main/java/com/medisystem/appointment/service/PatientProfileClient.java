package com.medisystem.appointment.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.time.LocalDate;

@Service
public class PatientProfileClient {

    private final RestClient restClient;
    private final String serviceToken;

    public PatientProfileClient(
            @Value("${patient-service.base-url}") String baseUrl,
            @Value("${patient-service.token}") String serviceToken
    ) {
        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .build();
        this.serviceToken = serviceToken;
    }

    public PatientProfileSnapshot getPatientById(Long patientId) {
        PatientServiceResponse response = restClient.get()
                .uri("/{id}", patientId)
                .header("X-Service-Token", serviceToken)
                .retrieve()
                .body(PatientServiceResponse.class);

        if (response == null) {
            throw new IllegalStateException("Не удалось получить профиль пациента для формирования заключения");
        }

        return new PatientProfileSnapshot(
                response.id(),
                response.fullName(),
                response.birthDate(),
                response.phone(),
                response.email(),
                response.gender(),
                response.address(),
                response.allergies(),
                response.chronicConditions(),
                response.bloodGroup(),
                response.rhFactor(),
                response.heightCm(),
                response.weightKg()
        );
    }

    private record PatientServiceResponse(
            Long id,
            Long userId,
            String fullName,
            LocalDate birthDate,
            String phone,
            String email,
            String gender,
            String address,
            String allergies,
            String chronicConditions,
            String bloodGroup,
            String rhFactor,
            Integer heightCm,
            BigDecimal weightKg,
            String emergencyContactName,
            String emergencyContactPhone,
            boolean active,
            java.time.OffsetDateTime createdAt,
            java.time.OffsetDateTime updatedAt
    ) {
    }

    public record PatientProfileSnapshot(
            Long id,
            String fullName,
            LocalDate birthDate,
            String phone,
            String email,
            String gender,
            String address,
            String allergies,
            String chronicConditions,
            String bloodGroup,
            String rhFactor,
            Integer heightCm,
            BigDecimal weightKg
    ) {
    }
}
