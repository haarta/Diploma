package com.medisystem.appointment.repo;

import com.medisystem.appointment.entity.LabResult;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LabResultRepository extends JpaRepository<LabResult, Long> {

    List<LabResult> findAllByUserIdOrderByOrderedAtDesc(Long userId);
}
