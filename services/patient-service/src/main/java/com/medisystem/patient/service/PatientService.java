package com.medisystem.patient.service;

import com.medisystem.patient.dto.PatientCreateRequest;
import com.medisystem.patient.dto.PatientUpdateRequest;
import com.medisystem.patient.entity.Patient;
import com.medisystem.patient.exception.PatientNotFoundException;
import com.medisystem.patient.repo.PatientRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Locale;

@Service
public class PatientService {

    private final PatientRepository repo;

    public PatientService(PatientRepository repo) {
        this.repo = repo;
    }

    @Transactional
    public Patient create(PatientCreateRequest req) {
        var patient = new Patient(
                req.userId,
                req.fullName,
                req.birthDate,
                req.phone,
                req.email,
                req.gender,
                req.address,
                req.allergies,
                req.chronicConditions,
                req.bloodGroup,
                req.rhFactor,
                req.emergencyContactName,
                req.emergencyContactPhone
        );
        return repo.save(patient);
    }

    @Transactional(readOnly = true)
    public Patient get(Long id) {
        return repo.findByIdAndActiveTrue(id)
                .orElseThrow(() -> new PatientNotFoundException("Patient not found: " + id));
    }

    @Transactional(readOnly = true)
    public Patient getByUserId(Long userId) {
        return repo.findByUserIdAndActiveTrue(userId)
                .orElseThrow(() -> new PatientNotFoundException("Patient not found for userId: " + userId));
    }

    @Transactional(readOnly = true)
    public Page<Patient> list(String q, String phone, Boolean active, Pageable pageable) {
        Specification<Patient> spec = (root, query, cb) -> {
            var predicates = new ArrayList<Predicate>();

            if (active != null) {
                predicates.add(cb.equal(root.get("active"), active));
            }

            if (q != null && !q.isBlank()) {
                String like = "%" + q.toLowerCase(Locale.ROOT) + "%";
                predicates.add(cb.like(cb.lower(root.get("fullName")), like));
            }

            if (phone != null && !phone.isBlank()) {
                String like = "%" + phone + "%";
                predicates.add(cb.like(root.get("phone"), like));
            }

            return cb.and(predicates.toArray(Predicate[]::new));
        };

        return repo.findAll(spec, pageable);
    }

    @Transactional
    public Patient patch(Long id, PatientUpdateRequest req) {
        Patient patient = get(id);

        if (req.userId != null) patient.setUserId(req.userId);
        if (req.fullName != null) patient.setFullName(req.fullName);
        if (req.birthDate != null) patient.setBirthDate(req.birthDate);
        if (req.phone != null) patient.setPhone(req.phone);
        if (req.email != null) patient.setEmail(req.email);
        if (req.gender != null) patient.setGender(req.gender);
        if (req.address != null) patient.setAddress(req.address);
        if (req.allergies != null) patient.setAllergies(req.allergies);
        if (req.chronicConditions != null) patient.setChronicConditions(req.chronicConditions);
        if (req.bloodGroup != null) patient.setBloodGroup(req.bloodGroup);
        if (req.rhFactor != null) patient.setRhFactor(req.rhFactor);
        if (req.emergencyContactName != null) patient.setEmergencyContactName(req.emergencyContactName);
        if (req.emergencyContactPhone != null) patient.setEmergencyContactPhone(req.emergencyContactPhone);

        return repo.save(patient);
    }

    @Transactional
    public void softDelete(Long id) {
        Patient patient = get(id);
        patient.setActive(false);
        repo.save(patient);
    }
}
