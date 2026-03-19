package com.medisystem.appointment.repo;

import com.medisystem.appointment.entity.DoctorMedicalDocument;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DoctorMedicalDocumentRepository extends JpaRepository<DoctorMedicalDocument, Long> {

    List<DoctorMedicalDocument> findAllByDoctorIdOrderByCreatedAtDesc(Long doctorId);

    List<DoctorMedicalDocument> findAllByDoctorIdAndAppointmentIdOrderByCreatedAtDesc(Long doctorId, Long appointmentId);

    List<DoctorMedicalDocument> findAllByAppointmentIdInOrderByCreatedAtDesc(List<Long> appointmentIds);
}
