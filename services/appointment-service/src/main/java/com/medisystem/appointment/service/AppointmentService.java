package com.medisystem.appointment.service;

import com.medisystem.appointment.dto.AppointmentCreateRequest;
import com.medisystem.appointment.dto.AppointmentUpdateRequest;
import com.medisystem.appointment.dto.publicapi.PublicBusyAppointmentSlotResponse;
import com.medisystem.appointment.entity.Appointment;
import com.medisystem.appointment.entity.AppointmentStatus;
import com.medisystem.appointment.entity.Doctor;
import com.medisystem.appointment.exception.DoctorNotFoundException;
import com.medisystem.appointment.exception.AppointmentNotFoundException;
import com.medisystem.appointment.messaging.AppointmentEventPublisher;
import com.medisystem.appointment.repo.AppointmentRepository;
import com.medisystem.appointment.repo.DoctorRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class AppointmentService {

    private final AppointmentRepository repo;
    private final DoctorRepository doctorRepository;
    private final AppointmentEventPublisher appointmentEventPublisher;
    private final UserNotificationService userNotificationService;

    public AppointmentService(
            AppointmentRepository repo,
            DoctorRepository doctorRepository,
            AppointmentEventPublisher appointmentEventPublisher,
            UserNotificationService userNotificationService
    ) {
        this.repo = repo;
        this.doctorRepository = doctorRepository;
        this.appointmentEventPublisher = appointmentEventPublisher;
        this.userNotificationService = userNotificationService;
    }

    @Transactional(readOnly = true)
    public List<Appointment> getAll() {
        return repo.findAllByOrderByAppointmentDateDescAppointmentTimeDesc();
    }

    @Transactional(readOnly = true)
    public Appointment getById(Long id) {
        return repo.findById(id)
                .orElseThrow(() -> new AppointmentNotFoundException("Прием не найден: " + id));
    }

    @Transactional
    public Appointment create(AppointmentCreateRequest req) {
        validateCreateRequest(req);
        Doctor doctor = requireDoctor(req.doctorId());
        Appointment appointment = new Appointment();
        appointment.setPatientId(req.patientId());
        appointment.setPatientFullName(req.patientFullName());
        appointment.setPatientEmail(req.patientEmail());
        appointment.setDoctorId(req.doctorId());
        appointment.setAppointmentDate(req.appointmentDate());
        appointment.setAppointmentTime(req.appointmentTime());
        appointment.setServiceName(req.serviceName().trim());
        appointment.setServicePrice(req.servicePrice());
        appointment.setServiceCurrency(normalizeCurrency(req.serviceCurrency()));
        appointment.setStatus(req.status() == null ? AppointmentStatus.SCHEDULED : req.status());
        appointment.setNotes(req.notes());
        Appointment saved = persistAppointment(appointment);
        appointmentEventPublisher.publishCreated(saved, doctor, req.patientEmail(), req.patientFullName());
        if (saved.getCreatedByUserId() != null) {
            userNotificationService.createNotification(
                    saved.getCreatedByUserId(),
                    saved.getId(),
                    "APPOINTMENT_CREATED",
                    "Запись оформлена",
                    "Вы записаны на " + saved.getAppointmentDate() + " в " + saved.getAppointmentTime() + ".",
                    "/cabinet/services"
            );
        }
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
            throw new IllegalArgumentException("Дата окончания периода не может быть раньше даты начала");
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
        appointment.setPatientFullName(req.patientFullName());
        appointment.setPatientEmail(req.patientEmail());
        appointment.setDoctorId(req.doctorId());
        appointment.setAppointmentDate(req.appointmentDate());
        appointment.setAppointmentTime(req.appointmentTime());
        appointment.setServiceName(req.serviceName().trim());
        appointment.setServicePrice(req.servicePrice());
        appointment.setServiceCurrency(normalizeCurrency(req.serviceCurrency()));
        appointment.setStatus(AppointmentStatus.SCHEDULED);
        appointment.setNotes(req.notes());
        Appointment saved = persistAppointment(appointment);
        appointmentEventPublisher.publishCreated(saved, doctor, req.patientEmail(), req.patientFullName());
        return saved;
    }

    @Transactional
    public Appointment cancelMine(long userId, Long appointmentId) {
        Appointment appointment = getById(appointmentId);

        if (appointment.getCreatedByUserId() == null || !appointment.getCreatedByUserId().equals(userId)) {
            throw new IllegalArgumentException("Можно отменить только собственную запись");
        }
        if (appointment.getStatus() == AppointmentStatus.CANCELLED) {
            return appointment;
        }
        if (appointment.getStatus() == AppointmentStatus.COMPLETED || appointment.getStatus() == AppointmentStatus.NO_SHOW) {
            throw new IllegalArgumentException("Завершенный прием нельзя отменить");
        }

        appointment.setStatus(AppointmentStatus.CANCELLED);
        Appointment saved = repo.save(appointment);
        Doctor doctor = requireDoctor(saved.getDoctorId());
        appointmentEventPublisher.publishCancelled(saved, doctor, saved.getPatientEmail(), saved.getPatientFullName());
        userNotificationService.createNotification(
                userId,
                saved.getId(),
                "APPOINTMENT_CANCELLED",
                "Запись отменена",
                "Вы отменили запись на " + saved.getAppointmentDate() + " в " + saved.getAppointmentTime() + ".",
                "/cabinet/services"
        );
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
        appointment.setServiceName(req.serviceName().trim());
        appointment.setServicePrice(req.servicePrice());
        appointment.setServiceCurrency(normalizeCurrency(req.serviceCurrency()));
        appointment.setStatus(req.status());
        appointment.setNotes(req.notes());
        return persistAppointment(appointment);
    }

    @Transactional
    public void delete(Long id) {
        Appointment appointment = getById(id);
        repo.delete(appointment);
    }

    private void validateCreateRequest(AppointmentCreateRequest req) {
        ensureDoctorExists(req.doctorId());
        ensureServiceName(req.serviceName());
        ensureAppointmentDateTime(req.appointmentDate(), req.appointmentTime());
        ensureSlotIsFree(req.doctorId(), req.appointmentDate(), req.appointmentTime(), null);
    }

    private void validateUpdateRequest(AppointmentUpdateRequest req, Long id) {
        ensureDoctorExists(req.doctorId());
        ensureServiceName(req.serviceName());
        ensureAppointmentDateTime(req.appointmentDate(), req.appointmentTime());
        ensureSlotIsFree(req.doctorId(), req.appointmentDate(), req.appointmentTime(), id);
    }

    private void ensureDoctorExists(Long doctorId) {
        requireDoctor(doctorId);
    }

    private Doctor requireDoctor(Long doctorId) {
        return doctorRepository.findById(doctorId)
                .orElseThrow(() -> new DoctorNotFoundException("Врач не найден: " + doctorId));
    }

    private void ensureAppointmentDateTime(LocalDate date, java.time.LocalTime time) {
        if (date == null || time == null) {
            throw new IllegalArgumentException("Необходимо указать дату и время приема");
        }
        if (LocalDateTime.of(date, time).isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Запись на прием должна быть оформлена на будущую дату и время");
        }
    }

    private void ensureSlotIsFree(Long doctorId, LocalDate date, java.time.LocalTime time, Long currentAppointmentId) {
        boolean occupied = repo.existsByDoctorIdAndAppointmentDateAndAppointmentTimeAndStatusNot(
                doctorId,
                date,
                time,
                AppointmentStatus.CANCELLED
        );
        if (occupied && currentAppointmentId != null) {
            Appointment current = getById(currentAppointmentId);
            occupied = !doctorId.equals(current.getDoctorId())
                    || !date.equals(current.getAppointmentDate())
                    || !time.equals(current.getAppointmentTime())
                    || current.getStatus() == AppointmentStatus.CANCELLED;
        }
        if (occupied) {
            throw new IllegalArgumentException("Выбранный слот уже занят");
        }
    }

    private void ensureServiceName(String serviceName) {
        if (serviceName == null || serviceName.isBlank()) {
            throw new IllegalArgumentException("Необходимо указать название услуги");
        }
    }

    private String normalizeCurrency(String currency) {
        if (currency == null || currency.isBlank()) {
            return "RUB";
        }
        return currency.trim().toUpperCase();
    }

    private Appointment persistAppointment(Appointment appointment) {
        try {
            return repo.save(appointment);
        } catch (DataIntegrityViolationException ex) {
            throw new IllegalArgumentException("Выбранный слот уже занят");
        }
    }
}
