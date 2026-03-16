package com.medisystem.appointment.repo;

import com.medisystem.appointment.entity.Appointment;
import com.medisystem.appointment.entity.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    List<Appointment> findAllByOrderByAppointmentDateDescAppointmentTimeDesc();

    List<Appointment> findAllByCreatedByUserIdOrderByAppointmentDateDescAppointmentTimeDesc(Long createdByUserId);

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
}
