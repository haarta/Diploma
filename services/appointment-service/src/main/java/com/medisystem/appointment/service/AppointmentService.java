package com.medisystem.appointment.service;

import com.medisystem.appointment.dto.AppointmentCreateRequest;
import com.medisystem.appointment.dto.AppointmentUpdateRequest;
import com.medisystem.appointment.entity.Appointment;
import com.medisystem.appointment.entity.AppointmentStatus;
import com.medisystem.appointment.exception.AppointmentNotFoundException;
import com.medisystem.appointment.repo.AppointmentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AppointmentService {

    private final AppointmentRepository repo;

    public AppointmentService(AppointmentRepository repo) {
        this.repo = repo;
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
        Appointment appointment = new Appointment();
        appointment.setPatientId(req.patientId());
        appointment.setDoctorId(req.doctorId());
        appointment.setAppointmentDate(req.appointmentDate());
        appointment.setAppointmentTime(req.appointmentTime());
        appointment.setStatus(req.status() == null ? AppointmentStatus.SCHEDULED : req.status());
        appointment.setNotes(req.notes());
        return repo.save(appointment);
    }

    @Transactional
    public Appointment update(Long id, AppointmentUpdateRequest req) {
        Appointment appointment = getById(id);
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
}
