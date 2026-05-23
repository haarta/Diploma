package com.medisystem.appointment.service;

import com.medisystem.appointment.dto.AppointmentCreateRequest;
import com.medisystem.appointment.entity.Appointment;
import com.medisystem.appointment.entity.AppointmentStatus;
import com.medisystem.appointment.entity.Doctor;
import com.medisystem.appointment.messaging.AppointmentEventPublisher;
import com.medisystem.appointment.repo.AppointmentRepository;
import com.medisystem.appointment.repo.DoctorRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AppointmentServiceTest {

    @Mock
    private AppointmentRepository repo;

    @Mock
    private DoctorRepository doctorRepository;

    @Mock
    private AppointmentEventPublisher appointmentEventPublisher;

    @Mock
    private UserNotificationService userNotificationService;

    @InjectMocks
    private AppointmentService appointmentService;

    @Test
    void createMineShouldPersistAppointmentAndPublishEvent() {
        Doctor doctor = new Doctor();
        doctor.setFullName("Dr. Test");

        AppointmentCreateRequest request = new AppointmentCreateRequest(
                15L,
                3L,
                LocalDate.now().plusDays(1),
                LocalTime.of(10, 0),
                null,
                "  notes  ",
                "Patient One",
                "patient@example.com",
                "Consultation",
                new BigDecimal("1500.00"),
                "rub"
        );

        when(doctorRepository.findById(3L)).thenReturn(Optional.of(doctor));
        when(repo.existsByDoctorIdAndAppointmentDateAndAppointmentTimeAndStatusNot(
                eq(3L),
                eq(request.appointmentDate()),
                eq(request.appointmentTime()),
                eq(AppointmentStatus.CANCELLED)
        )).thenReturn(false);
        when(repo.save(any(Appointment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Appointment saved = appointmentService.createMine(77L, request);

        assertThat(saved.getCreatedByUserId()).isEqualTo(77L);
        assertThat(saved.getStatus()).isEqualTo(AppointmentStatus.SCHEDULED);
        assertThat(saved.getServiceCurrency()).isEqualTo("RUB");
        verify(appointmentEventPublisher).publishCreated(saved, doctor, "patient@example.com", "Patient One");
        verify(userNotificationService, never()).createNotification(anyLong(), any(), any(), any(), any(), any());
    }

    @Test
    void createMineShouldTranslateConstraintViolationToDomainError() {
        Doctor doctor = new Doctor();

        AppointmentCreateRequest request = new AppointmentCreateRequest(
                15L,
                3L,
                LocalDate.now().plusDays(1),
                LocalTime.of(10, 0),
                null,
                null,
                "Patient One",
                "patient@example.com",
                "Consultation",
                null,
                null
        );

        when(doctorRepository.findById(3L)).thenReturn(Optional.of(doctor));
        when(repo.existsByDoctorIdAndAppointmentDateAndAppointmentTimeAndStatusNot(
                eq(3L),
                eq(request.appointmentDate()),
                eq(request.appointmentTime()),
                eq(AppointmentStatus.CANCELLED)
        )).thenReturn(false);
        when(repo.save(any(Appointment.class))).thenThrow(new DataIntegrityViolationException("duplicate slot"));

        assertThatThrownBy(() -> appointmentService.createMine(77L, request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Selected appointment slot is already booked");
    }

    @Test
    void cancelMineShouldRejectAppointmentOwnedByAnotherUser() {
        Appointment appointment = new Appointment();
        appointment.setCreatedByUserId(55L);
        appointment.setStatus(AppointmentStatus.SCHEDULED);

        when(repo.findById(1L)).thenReturn(Optional.of(appointment));

        assertThatThrownBy(() -> appointmentService.cancelMine(77L, 1L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("You can cancel only your own appointment");
    }
}
