package com.medisystem.appointment.service;

import com.medisystem.appointment.dto.admin.FileUploadResponse;
import com.medisystem.appointment.dto.doctor.DoctorAppointmentStatusUpdateRequest;
import com.medisystem.appointment.dto.doctor.DoctorMedicalDocumentResponse;
import com.medisystem.appointment.dto.doctor.DoctorProfileResponse;
import com.medisystem.appointment.dto.doctor.DoctorUpcomingAppointmentResponse;
import com.medisystem.appointment.dto.doctor.PatientDocumentResponse;
import com.medisystem.appointment.entity.Appointment;
import com.medisystem.appointment.entity.AppointmentStatus;
import com.medisystem.appointment.entity.Doctor;
import com.medisystem.appointment.entity.DoctorMedicalDocument;
import com.medisystem.appointment.entity.ReviewStatus;
import com.medisystem.appointment.repo.AppointmentRepository;
import com.medisystem.appointment.repo.DoctorMedicalDocumentRepository;
import com.medisystem.appointment.repo.DoctorRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
public class DoctorWorkspaceService {

    private static final String VISIT_REPORT_DOCUMENT_TYPE = "VISIT_REPORT";

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
    private final PatientProfileClient patientProfileClient;
    private final VisitReportPdfService visitReportPdfService;
    private final UserNotificationService userNotificationService;

    public DoctorWorkspaceService(
            DoctorRepository doctorRepository,
            AppointmentRepository appointmentRepository,
            DoctorMedicalDocumentRepository documentRepository,
            FileStorageService fileStorageService,
            PatientProfileClient patientProfileClient,
            VisitReportPdfService visitReportPdfService,
            UserNotificationService userNotificationService
    ) {
        this.doctorRepository = doctorRepository;
        this.appointmentRepository = appointmentRepository;
        this.documentRepository = documentRepository;
        this.fileStorageService = fileStorageService;
        this.patientProfileClient = patientProfileClient;
        this.visitReportPdfService = visitReportPdfService;
        this.userNotificationService = userNotificationService;
    }

    @Transactional(readOnly = true)
    public DoctorProfileResponse getProfile(long userId) {
        Doctor doctor = findDoctorByUserId(userId);
        return toProfileResponse(doctor);
    }

    @Transactional(readOnly = true)
    public List<DoctorUpcomingAppointmentResponse> getUpcomingAppointments(long userId) {
        Doctor doctor = findDoctorByUserId(userId);
        return appointmentRepository
                .findAllByDoctorIdAndAppointmentDateGreaterThanEqualOrderByAppointmentDateAscAppointmentTimeAsc(
                        doctor.getId(),
                        ClinicTime.today()
                )
                .stream()
                .filter(item -> item.getStatus() != AppointmentStatus.CANCELLED)
                .filter(item -> item.getStatus() != AppointmentStatus.COMPLETED)
                .filter(item -> item.getStatus() != AppointmentStatus.NO_SHOW)
                .map(this::toUpcomingResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<DoctorUpcomingAppointmentResponse> getCompletedAppointments(long userId) {
        Doctor doctor = findDoctorByUserId(userId);
        return appointmentRepository
                .findAllByDoctorIdOrderByAppointmentDateDescAppointmentTimeDesc(doctor.getId())
                .stream()
                .filter(item -> item.getStatus() == AppointmentStatus.COMPLETED)
                .map(this::toUpcomingResponse)
                .toList();
    }

    @Transactional
    public DoctorUpcomingAppointmentResponse updateAppointmentStatus(
            long userId,
            Long appointmentId,
            DoctorAppointmentStatusUpdateRequest request
    ) {
        Doctor doctor = findDoctorByUserId(userId);
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new IllegalArgumentException("Прием не найден: " + appointmentId));
        if (!appointment.getDoctorId().equals(doctor.getId())) {
            throw new IllegalArgumentException("Этот прием не относится к текущему врачу");
        }

        AppointmentStatus nextStatus = parseDoctorStatus(request.status());
        applyReportFields(appointment, request);
        appointment.setStatus(nextStatus);
        if (nextStatus == AppointmentStatus.COMPLETED) {
            validateCompletionReport(appointment);
            appointment.setCompletedAt(ClinicTime.nowOffset());
            appointment.setCompletionSummary(normalizeNullableText(request.completionSummary()));
        } else if (nextStatus == AppointmentStatus.CONFIRMED) {
            appointment.setCompletionSummary(normalizeNullableText(request.completionSummary()));
        } else if (nextStatus == AppointmentStatus.NO_SHOW) {
            appointment.setCompletionSummary(normalizeNullableText(request.completionSummary()));
        }

        Appointment saved = appointmentRepository.save(appointment);
        if (nextStatus == AppointmentStatus.COMPLETED) {
            createOrUpdateVisitReport(saved, doctor);
        }
        if (saved.getCreatedByUserId() != null) {
            userNotificationService.createNotification(
                    saved.getCreatedByUserId(),
                    saved.getId(),
                    "APPOINTMENT_STATUS",
                    statusTitle(nextStatus),
                    statusMessage(saved, doctor, nextStatus),
                    nextStatus == AppointmentStatus.COMPLETED ? "/cabinet/visits" : "/cabinet/services"
            );
        }
        return toUpcomingResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<PatientDocumentResponse> getPatientDocuments(long userId) {
        List<Long> appointmentIds = appointmentRepository
                .findAllByCreatedByUserIdOrderByAppointmentDateDescAppointmentTimeDesc(userId)
                .stream()
                .map(Appointment::getId)
                .toList();
        if (appointmentIds.isEmpty()) {
            return List.of();
        }
        return documentRepository.findAllByAppointmentIdInOrderByCreatedAtDesc(appointmentIds).stream()
                .map(item -> new PatientDocumentResponse(
                        item.getId(),
                        item.getAppointmentId(),
                        item.getDocumentType(),
                        item.getFileName(),
                        item.getFileUrl(),
                        item.getCreatedAt()
                ))
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
                .orElseThrow(() -> new IllegalArgumentException("Прием не найден: " + appointmentId));
        if (!appointment.getDoctorId().equals(doctor.getId())) {
            throw new IllegalArgumentException("Этот прием не относится к текущему врачу");
        }

        String mimeType = file == null ? null : file.getContentType();
        if (mimeType == null || !ALLOWED_MIME_TYPES.contains(mimeType.toLowerCase(Locale.ROOT))) {
            throw new IllegalArgumentException("Неподдерживаемый тип файла. Допустимы: PDF, PNG, JPG, WEBP");
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

        DoctorMedicalDocument saved = documentRepository.save(document);
        if (appointment.getCreatedByUserId() != null) {
            userNotificationService.createNotification(
                    appointment.getCreatedByUserId(),
                    appointment.getId(),
                    "MEDICAL_DOCUMENT",
                    "Врач загрузил документ",
                    "В личном кабинете доступен новый медицинский документ по приёму от " + appointment.getAppointmentDate() + ".",
                    "/cabinet/visits"
            );
        }
        return toDocumentResponse(saved);
    }

    private Doctor findDoctorByUserId(long userId) {
        return doctorRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Профиль врача не привязан к этой учетной записи"));
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

    private void applyReportFields(Appointment appointment, DoctorAppointmentStatusUpdateRequest request) {
        appointment.setComplaints(normalizeNullableText(request.complaints()));
        appointment.setAnamnesis(normalizeNullableText(request.anamnesis()));
        appointment.setObjectiveFindings(normalizeNullableText(request.objectiveFindings()));
        appointment.setDiagnosis(normalizeNullableText(request.diagnosis()));
        appointment.setPrescriptions(normalizeNullableText(request.prescriptions()));
        appointment.setTreatmentPlan(normalizeNullableText(request.treatmentPlan()));
    }

    private void validateCompletionReport(Appointment appointment) {
        requireField(appointment.getComplaints(), "жалобы");
        requireField(appointment.getAnamnesis(), "анамнез");
        requireField(appointment.getObjectiveFindings(), "объективные данные");
        requireField(appointment.getDiagnosis(), "диагноз");
        requireField(appointment.getPrescriptions(), "назначения");
        requireField(appointment.getTreatmentPlan(), "план лечения");
    }

    private void requireField(String value, String label) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Для завершения приема необходимо заполнить поле: " + label);
        }
    }

    private void createOrUpdateVisitReport(Appointment appointment, Doctor doctor) {
        PatientProfileClient.PatientProfileSnapshot patient = patientProfileClient.getPatientById(appointment.getPatientId());
        byte[] pdfBytes = visitReportPdfService.generate(appointment, doctor, patient);
        FileUploadResponse upload = fileStorageService.uploadBytes(
                pdfBytes,
                "doctor-documents/" + doctor.getId() + "/visit-reports",
                buildVisitReportFileName(appointment),
                "application/pdf"
        );

        DoctorMedicalDocument document = documentRepository
                .findFirstByAppointmentIdAndDocumentTypeOrderByCreatedAtDesc(appointment.getId(), VISIT_REPORT_DOCUMENT_TYPE)
                .orElseGet(DoctorMedicalDocument::new);

        document.setDoctorId(doctor.getId());
        document.setPatientId(appointment.getPatientId());
        document.setAppointmentId(appointment.getId());
        document.setDocumentType(VISIT_REPORT_DOCUMENT_TYPE);
        document.setFileName(buildVisitReportFileName(appointment));
        document.setContentType(upload.contentType());
        document.setFileSize(upload.size());
        document.setFileKey(upload.key());
        document.setFileUrl(upload.url());
        documentRepository.save(document);
    }

    private String buildVisitReportFileName(Appointment appointment) {
        return "visit-report-" + appointment.getId() + ".pdf";
    }

    private DoctorUpcomingAppointmentResponse toUpcomingResponse(Appointment appointment) {
        return new DoctorUpcomingAppointmentResponse(
                appointment.getId(),
                appointment.getPatientId(),
                appointment.getDoctorId(),
                appointment.getPatientFullName(),
                appointment.getPatientEmail(),
                appointment.getAppointmentDate(),
                appointment.getAppointmentTime(),
                appointment.getStatus().name(),
                appointment.getNotes(),
                appointment.getServiceName(),
                appointment.getCompletionSummary(),
                appointment.getComplaints(),
                appointment.getAnamnesis(),
                appointment.getObjectiveFindings(),
                appointment.getDiagnosis(),
                appointment.getPrescriptions(),
                appointment.getTreatmentPlan()
        );
    }

    private DoctorProfileResponse toProfileResponse(Doctor doctor) {
        var approvedReviews = doctor.getReviews().stream()
                .filter(item -> item.getStatus() == ReviewStatus.APPROVED)
                .toList();

        Double averageRating = approvedReviews.isEmpty()
                ? null
                : approvedReviews.stream()
                .mapToInt(item -> item.getRating() == null ? 0 : item.getRating())
                .average()
                .orElse(0.0d);

        return new DoctorProfileResponse(
                doctor.getId(),
                doctor.getUserId(),
                doctor.getFullName(),
                doctor.getSpecialty(),
                doctor.getExperienceYears(),
                doctor.getPhotoUrl(),
                doctor.getDescription(),
                doctor.getBranch(),
                doctor.isPublished(),
                approvedReviews.size(),
                averageRating
        );
    }

    private AppointmentStatus parseDoctorStatus(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Необходимо указать статус");
        }
        AppointmentStatus status = AppointmentStatus.valueOf(value.trim().toUpperCase(Locale.ROOT));
        if (status != AppointmentStatus.CONFIRMED
                && status != AppointmentStatus.COMPLETED
                && status != AppointmentStatus.NO_SHOW) {
            throw new IllegalArgumentException("Врач может установить только статусы «подтвержден», «завершен» или «неявка»");
        }
        return status;
    }

    private String normalizeNullableText(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private String statusTitle(AppointmentStatus status) {
        return switch (status) {
            case CONFIRMED -> "Приём подтверждён";
            case COMPLETED -> "Приём завершён";
            case NO_SHOW -> "Приём отмечен как неявка";
            default -> "Статус приёма изменён";
        };
    }

    private String statusMessage(Appointment appointment, Doctor doctor, AppointmentStatus status) {
        return switch (status) {
            case CONFIRMED ->
                    "Врач " + doctor.getFullName() + " подтвердил ваш приём на " + appointment.getAppointmentDate() + " в " + appointment.getAppointmentTime() + ".";
            case COMPLETED ->
                    "Врач " + doctor.getFullName() + " завершил приём. Проверьте раздел завершённых посещений и прикреплённые документы.";
            case NO_SHOW ->
                    "По записи от " + appointment.getAppointmentDate() + " врач отметил неявку пациента.";
            default -> "Статус приёма был изменён.";
        };
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
