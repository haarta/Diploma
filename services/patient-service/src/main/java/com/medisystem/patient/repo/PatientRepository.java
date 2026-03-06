package com.medisystem.patient.repo;

import com.medisystem.patient.entity.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface PatientRepository extends JpaRepository<Patient, Long>, JpaSpecificationExecutor<Patient> {
    Optional<Patient> findByIdAndActiveTrue(Long id);
    Optional<Patient> findByUserIdAndActiveTrue(Long userId);
}
