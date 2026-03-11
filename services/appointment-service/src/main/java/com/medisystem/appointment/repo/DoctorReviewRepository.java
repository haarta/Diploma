package com.medisystem.appointment.repo;

import com.medisystem.appointment.entity.DoctorReview;
import com.medisystem.appointment.entity.ReviewStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DoctorReviewRepository extends JpaRepository<DoctorReview, Long> {

    List<DoctorReview> findAllByStatusOrderByCreatedAtDesc(ReviewStatus status);
}
