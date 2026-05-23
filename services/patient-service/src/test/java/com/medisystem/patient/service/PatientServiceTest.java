package com.medisystem.patient.service;

import com.medisystem.patient.dto.PatientCreateRequest;
import com.medisystem.patient.dto.PatientUpdateRequest;
import com.medisystem.patient.entity.Patient;
import com.medisystem.patient.repo.PatientRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PatientServiceTest {

    @Mock
    private PatientRepository repo;

    @InjectMocks
    private PatientService patientService;

    @Test
    void createShouldPersistMedcardMetrics() {
        PatientCreateRequest request = new PatientCreateRequest();
        request.userId = 10L;
        request.fullName = "Patient One";
        request.birthDate = LocalDate.of(1990, 1, 1);
        request.phone = "+79990000000";
        request.email = "patient@example.com";
        request.heightCm = 182;
        request.weightKg = new BigDecimal("78.40");

        when(repo.existsByUserIdAndActiveTrue(10L)).thenReturn(false);
        when(repo.save(any(Patient.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Patient saved = patientService.create(request);

        assertThat(saved.getHeightCm()).isEqualTo(182);
        assertThat(saved.getWeightKg()).isEqualByComparingTo("78.40");

        ArgumentCaptor<Patient> patientCaptor = ArgumentCaptor.forClass(Patient.class);
        verify(repo).save(patientCaptor.capture());
        assertThat(patientCaptor.getValue().getHeightCm()).isEqualTo(182);
        assertThat(patientCaptor.getValue().getWeightKg()).isEqualByComparingTo("78.40");
    }

    @Test
    void patchMineShouldUpdateMedcardMetrics() {
        Patient patient = new Patient(
                10L,
                "Patient One",
                LocalDate.of(1990, 1, 1),
                "+79990000000",
                "patient@example.com",
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null
        );

        PatientUpdateRequest request = new PatientUpdateRequest();
        request.heightCm = 176;
        request.weightKg = new BigDecimal("70.25");
        request.bloodGroup = "II";

        when(repo.findByUserIdAndActiveTrue(10L)).thenReturn(Optional.of(patient));
        when(repo.save(any(Patient.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Patient updated = patientService.patchMine(10L, request);

        assertThat(updated.getHeightCm()).isEqualTo(176);
        assertThat(updated.getWeightKg()).isEqualByComparingTo("70.25");
        assertThat(updated.getBloodGroup()).isEqualTo("II");
    }

    @Test
    void createShouldRejectDuplicateActiveUserProfile() {
        PatientCreateRequest request = new PatientCreateRequest();
        request.userId = 10L;
        request.fullName = "Patient One";

        when(repo.existsByUserIdAndActiveTrue(10L)).thenReturn(true);

        assertThatThrownBy(() -> patientService.create(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Patient profile already exists for this user");
    }
}
