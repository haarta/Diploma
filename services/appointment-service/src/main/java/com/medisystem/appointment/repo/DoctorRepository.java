package com.medisystem.appointment.repo;

import com.medisystem.appointment.entity.Doctor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DoctorRepository extends JpaRepository<Doctor, Long> {

    List<Doctor> findAllByPublishedTrueOrderByFullNameAsc();

    List<Doctor> findAllByOrderByFullNameAsc();

    Optional<Doctor> findByUserId(Long userId);

    boolean existsByUserId(Long userId);
}
