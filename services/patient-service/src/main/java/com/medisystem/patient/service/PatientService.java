package com.medisystem.patient.service;

import com.medisystem.patient.dto.PatientCreateRequest;
import com.medisystem.patient.entity.Patient;
import com.medisystem.patient.repo.PatientRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PatientService {

    private final PatientRepository repo;

    public PatientService(PatientRepository repo) {
        this.repo = repo;
    }

    @Transactional
    public Patient create(PatientCreateRequest req) {
        var patient = new Patient(req.userId, req.fullName, req.birthDate, req.phone);
        return repo.save(patient);
    }

    @Transactional(readOnly = true)
    public Patient get(Long id) {
        return repo.findById(id).orElseThrow(() -> new IllegalArgumentException("Patient not found: " + id));
    }

    @Transactional(readOnly = true)
    public Patient getByUserId(Long userId) {
        return repo.findByUserId(userId).orElseThrow(() -> new IllegalArgumentException("Patient not found for userId: " + userId));
    }
}