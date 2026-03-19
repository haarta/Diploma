package com.medisystem.appointment.repo;

import com.medisystem.appointment.entity.Appointment;
import com.medisystem.appointment.entity.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.List;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    List<Appointment> findAllByOrderByAppointmentDateDescAppointmentTimeDesc();

    List<Appointment> findAllByAppointmentDateBetweenOrderByAppointmentDateAscAppointmentTimeAsc(
            LocalDate dateFrom,
            LocalDate dateTo
    );

    List<Appointment> findAllByAppointmentDateBetweenAndStatusInOrderByAppointmentDateAscAppointmentTimeAsc(
            LocalDate dateFrom,
            LocalDate dateTo,
            List<AppointmentStatus> statuses
    );

    List<Appointment> findAllByCreatedByUserIdOrderByAppointmentDateDescAppointmentTimeDesc(Long createdByUserId);

    List<Appointment> findAllByCreatedByUserIdAndStatusInOrderByAppointmentDateDescAppointmentTimeDesc(
            Long createdByUserId,
            List<AppointmentStatus> statuses
    );

    List<Appointment> findAllByDoctorIdAndAppointmentDateGreaterThanEqualOrderByAppointmentDateAscAppointmentTimeAsc(
            Long doctorId,
            LocalDate appointmentDate
    );

    List<Appointment> findAllByDoctorIdAndAppointmentDateAndStatusNotOrderByAppointmentTimeAsc(
            Long doctorId,
            LocalDate appointmentDate,
            AppointmentStatus status
    );

    List<Appointment> findAllByDoctorIdAndAppointmentDateBetweenAndStatusNotOrderByAppointmentDateAscAppointmentTimeAsc(
            Long doctorId,
            LocalDate dateFrom,
            LocalDate dateTo,
            AppointmentStatus status
    );

    boolean existsByDoctorIdAndAppointmentDateAndAppointmentTimeAndStatusNot(
            Long doctorId,
            LocalDate appointmentDate,
            LocalTime appointmentTime,
            AppointmentStatus status
    );

    List<Appointment> findAllByCreatedByUserIdIsNotNullAndAppointmentDateBetweenOrderByAppointmentDateAscAppointmentTimeAsc(
            LocalDate dateFrom,
            LocalDate dateTo
    );
}
