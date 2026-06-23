package com.medisystem.appointment.repo;

import com.medisystem.appointment.entity.DoctorReview;
import com.medisystem.appointment.entity.ReviewStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface DoctorReviewRepository extends JpaRepository<DoctorReview, Long> {

    List<DoctorReview> findAllByStatusOrderByCreatedAtDesc(ReviewStatus status);
    List<DoctorReview> findAllByCreatedByUserIdOrderByCreatedAtDesc(Long createdByUserId);
    List<DoctorReview> findAllByAppointmentIdIn(Collection<Long> appointmentIds);
    Optional<DoctorReview> findByAppointmentId(Long appointmentId);
}
