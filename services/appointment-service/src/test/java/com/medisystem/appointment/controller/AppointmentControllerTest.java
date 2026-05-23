package com.medisystem.appointment.controller;

import com.medisystem.appointment.entity.Appointment;
import com.medisystem.appointment.entity.AppointmentStatus;
import com.medisystem.appointment.service.AppointmentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AppointmentControllerTest {

    @Mock
    private AppointmentService appointmentService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .standaloneSetup(new AppointmentController(appointmentService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void getByIdShouldReturnResponseDtoShapeInsteadOfEntity() throws Exception {
        Appointment appointment = new Appointment();
        ReflectionTestUtils.setField(appointment, "id", 44L);
        appointment.setPatientId(12L);
        appointment.setCreatedByUserId(77L);
        appointment.setPatientFullName("Patient One");
        appointment.setPatientEmail("patient@example.com");
        appointment.setDoctorId(9L);
        appointment.setAppointmentDate(LocalDate.of(2026, 5, 20));
        appointment.setAppointmentTime(LocalTime.of(14, 30));
        appointment.setServiceName("Consultation");
        appointment.setServicePrice(new BigDecimal("2500.00"));
        appointment.setServiceCurrency("RUB");
        appointment.setStatus(AppointmentStatus.CONFIRMED);
        appointment.setNotes("Bring previous tests");
        appointment.setCompletionSummary("All good");
        appointment.setCompletedAt(OffsetDateTime.parse("2026-05-20T14:50:00+03:00"));
        appointment.setReminder24hSentAt(OffsetDateTime.parse("2026-05-19T14:30:00+03:00"));
        appointment.setReminder2hSentAt(OffsetDateTime.parse("2026-05-20T12:30:00+03:00"));

        when(appointmentService.getById(44L)).thenReturn(appointment);

        mockMvc.perform(get("/api/appointments/44").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(44))
                .andExpect(jsonPath("$.patientId").value(12))
                .andExpect(jsonPath("$.doctorId").value(9))
                .andExpect(jsonPath("$.status").value("CONFIRMED"))
                .andExpect(jsonPath("$.completionSummary").value("All good"))
                .andExpect(jsonPath("$.createdByUserId").doesNotExist())
                .andExpect(jsonPath("$.reminder24hSentAt").doesNotExist())
                .andExpect(jsonPath("$.reminder2hSentAt").doesNotExist());
    }
}
