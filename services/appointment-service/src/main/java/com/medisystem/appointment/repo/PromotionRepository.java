package com.medisystem.appointment.repo;

import com.medisystem.appointment.entity.Promotion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PromotionRepository extends JpaRepository<Promotion, Long> {

    List<Promotion> findAllByPublishedTrueOrderByActiveFromDescIdDesc();

    List<Promotion> findAllByOrderByCreatedAtDescIdDesc();
}
