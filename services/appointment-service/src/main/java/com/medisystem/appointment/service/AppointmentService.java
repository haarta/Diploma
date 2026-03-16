package com.medisystem.appointment.service;

import com.medisystem.appointment.dto.AppointmentCreateRequest;
import com.medisystem.appointment.dto.AppointmentUpdateRequest;
import com.medisystem.appointment.dto.publicapi.PublicBusyAppointmentSlotResponse;
import com.medisystem.appointment.entity.Appointment;
import com.medisystem.appointment.entity.AppointmentStatus;
import com.medisystem.appointment.entity.Doctor;
import com.medisystem.appointment.exception.DoctorNotFoundException;
import com.medisystem.appointment.exception.AppointmentNotFoundException;
import com.medisystem.appointment.repo.AppointmentRepository;
import com.medisystem.appointment.repo.DoctorRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class AppointmentService {

    private final AppointmentRepository repo;
    private final DoctorRepository doctorRepository;
    private final AppointmentNotificationService appointmentNotificationService;

    public AppointmentService(
            AppointmentRepository repo,
            DoctorRepository doctorRepository,
            AppointmentNotificationService appointmentNotificationService
    ) {
        this.repo = repo;
        this.doctorRepository = doctorRepository;
        this.appointmentNotificationService = appointmentNotificationService;
    }

    @Transactional(readOnly = true)
    public List<Appointment> getAll() {
        return repo.findAllByOrderByAppointmentDateDescAppointmentTimeDesc();
    }

    @Transactional(readOnly = true)
    public Appointment getById(Long id) {
        return repo.findById(id)
                .orElseThrow(() -> new AppointmentNotFoundException("Appointment not found: " + id));
    }

    @Transactional
    public Appointment create(AppointmentCreateRequest req) {
        validateCreateRequest(req);
        Doctor doctor = requireDoctor(req.doctorId());
        Appointment appointment = new Appointment();
        appointment.setPatientId(req.patientId());
        appointment.setDoctorId(req.doctorId());
        appointment.setAppointmentDate(req.appointmentDate());
        appointment.setAppointmentTime(req.appointmentTime());
        appointment.setStatus(req.status() == null ? AppointmentStatus.SCHEDULED : req.status());
        appointment.setNotes(req.notes());
        Appointment saved = repo.save(appointment);
        appointmentNotificationService.sendAppointmentCreatedEmail(saved, doctor, req.patientEmail(), req.patientFullName());
        return saved;
    }

    @Transactional(readOnly = true)
    public List<Appointment> getMine(long userId) {
        return repo.findAllByCreatedByUserIdOrderByAppointmentDateDescAppointmentTimeDesc(userId);
    }

    @Transactional(readOnly = true)
    public List<PublicBusyAppointmentSlotResponse> getBusySlots(Long doctorId, LocalDate dateFrom, LocalDate dateTo) {
        ensureDoctorExists(doctorId);
        LocalDate rangeStart = dateFrom == null ? LocalDate.now() : dateFrom;
        LocalDate rangeEnd = dateTo == null ? rangeStart : dateTo;
        if (rangeEnd.isBefore(rangeStart)) {
            throw new IllegalArgumentException("dateTo must be greater than or equal to dateFrom");
        }
        return repo.findAllByDoctorIdAndAppointmentDateBetweenAndStatusNotOrderByAppointmentDateAscAppointmentTimeAsc(
                        doctorId,
                        rangeStart,
                        rangeEnd,
                        AppointmentStatus.CANCELLED
                ).stream()
                .map(item -> new PublicBusyAppointmentSlotResponse(
                        item.getAppointmentDate(),
                        item.getAppointmentTime(),
                        item.getStatus().name()
                ))
                .toList();
    }

    @Transactional
    public Appointment createMine(long userId, AppointmentCreateRequest req) {
        validateCreateRequest(req);
        Doctor doctor = requireDoctor(req.doctorId());

        Appointment appointment = new Appointment();
        appointment.setCreatedByUserId(userId);
        appointment.setPatientId(req.patientId());
        appointment.setDoctorId(req.doctorId());
        appointment.setAppointmentDate(req.appointmentDate());
        appointment.setAppointmentTime(req.appointmentTime());
        appointment.setStatus(AppointmentStatus.SCHEDULED);
        appointment.setNotes(req.notes());
        Appointment saved = repo.save(appointment);
        appointmentNotificationService.sendAppointmentCreatedEmail(saved, doctor, req.patientEmail(), req.patientFullName());
        return saved;
    }

    @Transactional
    public Appointment update(Long id, AppointmentUpdateRequest req) {
        Appointment appointment = getById(id);
        validateUpdateRequest(req, id);
        appointment.setPatientId(req.patientId());
        appointment.setDoctorId(req.doctorId());
        appointment.setAppointmentDate(req.appointmentDate());
        appointment.setAppointmentTime(req.appointmentTime());
        appointment.setStatus(req.status());
        appointment.setNotes(req.notes());
        return repo.save(appointment);
    }

    @Transactional
    public void delete(Long id) {
        Appointment appointment = getById(id);
        repo.delete(appointment);
    }

    private void validateCreateRequest(AppointmentCreateRequest req) {
        ensureDoctorExists(req.doctorId());
        ensureAppointmentDateTime(req.appointmentDate(), req.appointmentTime());
        ensureSlotIsFree(req.doctorId(), req.appointmentDate(), req.appointmentTime(), null);
    }

    private void validateUpdateRequest(AppointmentUpdateRequest req, Long id) {
        ensureDoctorExists(req.doctorId());
        ensureAppointmentDateTime(req.appointmentDate(), req.appointmentTime());
        ensureSlotIsFree(req.doctorId(), req.appointmentDate(), req.appointmentTime(), id);
    }

    private void ensureDoctorExists(Long doctorId) {
        requireDoctor(doctorId);
    }

    private Doctor requireDoctor(Long doctorId) {
        return doctorRepository.findById(doctorId)
                .orElseThrow(() -> new DoctorNotFoundException("Doctor not found: " + doctorId));
    }

    private void ensureAppointmentDateTime(LocalDate date, java.time.LocalTime time) {
        if (date == null || time == null) {
            throw new IllegalArgumentException("Appointment date and time are required");
        }
        if (LocalDateTime.of(date, time).isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Appointment must be scheduled in the future");
        }
    }

    private void ensureSlotIsFree(Long doctorId, LocalDate date, java.time.LocalTime time, Long currentAppointmentId) {
        boolean occupied = repo.findAllByDoctorIdAndAppointmentDateAndStatusNotOrderByAppointmentTimeAsc(
                        doctorId,
                        date,
                        AppointmentStatus.CANCELLED
                ).stream()
                .anyMatch(item ->
                        item.getAppointmentTime().equals(time)
                                && (currentAppointmentId == null || !item.getId().equals(currentAppointmentId))
                );
        if (occupied) {
            throw new IllegalArgumentException("Selected appointment slot is already booked");
        }
    }
}
