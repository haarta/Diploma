package com.medisystem.auth.repo;

import com.medisystem.auth.entity.DoctorVerificationApplication;
import com.medisystem.auth.entity.DoctorVerificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DoctorVerificationApplicationRepository extends JpaRepository<DoctorVerificationApplication, Long> {

    Optional<DoctorVerificationApplication> findByUserId(Long userId);

    List<DoctorVerificationApplication> findAllByStatusOrderByUpdatedAtDesc(DoctorVerificationStatus status);
}
