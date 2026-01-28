package com.medisystem.kurs.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface PatientRepository extends JpaRepository<Patient, Long> {
    Optional<Patient> findByPhoneNumber(String phoneNumber);
    List<Patient> findByFullNameContainingIgnoreCase(String name);
}
