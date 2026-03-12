package com.medisystem.appointment.repo;

import com.medisystem.appointment.entity.OnlineConsultation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OnlineConsultationRepository extends JpaRepository<OnlineConsultation, Long> {

    List<OnlineConsultation> findAllByPublishedTrueOrderByDisplayOrderAscCreatedAtDescIdDesc();

    List<OnlineConsultation> findAllByOrderByDisplayOrderAscCreatedAtDescIdDesc();
}
