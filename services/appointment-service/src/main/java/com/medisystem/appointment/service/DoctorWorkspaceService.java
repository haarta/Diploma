package com.medisystem.appointment.service;

import com.medisystem.appointment.dto.admin.FileUploadResponse;
import com.medisystem.appointment.dto.doctor.DoctorMedicalDocumentResponse;
import com.medisystem.appointment.dto.doctor.DoctorUpcomingAppointmentResponse;
import com.medisystem.appointment.entity.Appointment;
import com.medisystem.appointment.entity.Doctor;
import com.medisystem.appointment.entity.DoctorMedicalDocument;
import com.medisystem.appointment.repo.AppointmentRepository;
import com.medisystem.appointment.repo.DoctorMedicalDocumentRepository;
import com.medisystem.appointment.repo.DoctorRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
public class DoctorWorkspaceService {

    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            "application/pdf",
            "image/png",
            "image/jpeg",
            "image/webp"
    );

    private final DoctorRepository doctorRepository;
    private final AppointmentRepository appointmentRepository;
    private final DoctorMedicalDocumentRepository documentRepository;
    private final FileStorageService fileStorageService;

    public DoctorWorkspaceService(
            DoctorRepository doctorRepository,
            AppointmentRepository appointmentRepository,
            DoctorMedicalDocumentRepository documentRepository,
            FileStorageService fileStorageService
    ) {
        this.doctorRepository = doctorRepository;
        this.appointmentRepository = appointmentRepository;
        this.documentRepository = documentRepository;
        this.fileStorageService = fileStorageService;
    }

    @Transactional(readOnly = true)
    public List<DoctorUpcomingAppointmentResponse> getUpcomingAppointments(long userId) {
        Doctor doctor = findDoctorByUserId(userId);
        return appointmentRepository
                .findAllByDoctorIdAndAppointmentDateGreaterThanEqualOrderByAppointmentDateAscAppointmentTimeAsc(
                        doctor.getId(),
                        LocalDate.now()
                )
                .stream()
                .map(this::toUpcomingResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<DoctorMedicalDocumentResponse> getDocuments(long userId, Long appointmentId) {
        Doctor doctor = findDoctorByUserId(userId);
        List<DoctorMedicalDocument> items = appointmentId == null
                ? documentRepository.findAllByDoctorIdOrderByCreatedAtDesc(doctor.getId())
                : documentRepository.findAllByDoctorIdAndAppointmentIdOrderByCreatedAtDesc(doctor.getId(), appointmentId);
        return items.stream().map(this::toDocumentResponse).toList();
    }

    @Transactional
    public DoctorMedicalDocumentResponse uploadDocument(
            long userId,
            Long appointmentId,
            String documentType,
            MultipartFile file
    ) {
        Doctor doctor = findDoctorByUserId(userId);

        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new IllegalArgumentException("Appointment not found: " + appointmentId));
        if (!appointment.getDoctorId().equals(doctor.getId())) {
            throw new IllegalArgumentException("Appointment does not belong to current doctor");
        }

        String mimeType = file == null ? null : file.getContentType();
        if (mimeType == null || !ALLOWED_MIME_TYPES.contains(mimeType.toLowerCase(Locale.ROOT))) {
            throw new IllegalArgumentException("Unsupported file type. Allowed: PDF, PNG, JPG, WEBP");
        }

        String normalizedType = normalizeDocumentType(documentType);
        FileUploadResponse upload = fileStorageService.upload(file, "doctor-documents/" + doctor.getId());

        DoctorMedicalDocument document = new DoctorMedicalDocument();
        document.setDoctorId(doctor.getId());
        document.setPatientId(appointment.getPatientId());
        document.setAppointmentId(appointment.getId());
        document.setDocumentType(normalizedType);
        document.setFileName(resolveSafeFileName(file.getOriginalFilename()));
        document.setContentType(upload.contentType());
        document.setFileSize(upload.size());
        document.setFileKey(upload.key());
        document.setFileUrl(upload.url());

        return toDocumentResponse(documentRepository.save(document));
    }

    private Doctor findDoctorByUserId(long userId) {
        return doctorRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Doctor profile is not linked to this account"));
    }

    private String normalizeDocumentType(String value) {
        if (value == null || value.isBlank()) {
            return "OTHER";
        }
        String normalized = value.trim().toUpperCase(Locale.ROOT);
        return normalized.replaceAll("[^A-Z0-9_\\-]", "_");
    }

    private String resolveSafeFileName(String originalFileName) {
        if (originalFileName == null || originalFileName.isBlank()) {
            return "document";
        }
        String normalized = originalFileName.replace("\\", "/");
        int slashIndex = normalized.lastIndexOf('/');
        if (slashIndex >= 0) {
            normalized = normalized.substring(slashIndex + 1);
        }
        return normalized.isBlank() ? "document" : normalized;
    }

    private DoctorUpcomingAppointmentResponse toUpcomingResponse(Appointment appointment) {
        return new DoctorUpcomingAppointmentResponse(
                appointment.getId(),
                appointment.getPatientId(),
                appointment.getDoctorId(),
                appointment.getAppointmentDate(),
                appointment.getAppointmentTime(),
                appointment.getStatus().name(),
                appointment.getNotes()
        );
    }

    private DoctorMedicalDocumentResponse toDocumentResponse(DoctorMedicalDocument item) {
        return new DoctorMedicalDocumentResponse(
                item.getId(),
                item.getDoctorId(),
                item.getPatientId(),
                item.getAppointmentId(),
                item.getDocumentType(),
                item.getFileName(),
                item.getContentType(),
                item.getFileSize(),
                item.getFileKey(),
                item.getFileUrl(),
                item.getCreatedAt()
        );
    }
}
