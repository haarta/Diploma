package com.medisystem.auth.service;

import com.medisystem.auth.dto.DoctorVerificationApplicationResponse;
import com.medisystem.auth.dto.DoctorVerificationReviewRequest;
import com.medisystem.auth.dto.DoctorVerificationSubmitRequest;
import com.medisystem.auth.entity.DoctorVerificationApplication;
import com.medisystem.auth.entity.DoctorVerificationStatus;
import com.medisystem.auth.entity.Role;
import com.medisystem.auth.entity.UserAccount;
import com.medisystem.auth.repo.DoctorVerificationApplicationRepository;
import com.medisystem.auth.repo.UserAccountRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
public class DoctorVerificationService {

    private final DoctorVerificationApplicationRepository applicationRepository;
    private final UserAccountRepository userAccountRepository;

    public DoctorVerificationService(
            DoctorVerificationApplicationRepository applicationRepository,
            UserAccountRepository userAccountRepository
    ) {
        this.applicationRepository = applicationRepository;
        this.userAccountRepository = userAccountRepository;
    }

    @Transactional
    public DoctorVerificationApplicationResponse submit(long userId, DoctorVerificationSubmitRequest req) {
        UserAccount user = findUser(userId);
        if (user.getRole() == Role.ADMIN) {
            throw new IllegalArgumentException("Admin cannot submit doctor verification");
        }

        DoctorVerificationApplication application = applicationRepository.findByUserId(userId)
                .orElseGet(DoctorVerificationApplication::new);
        application.setUserId(userId);
        application.setFullName(req.fullName.trim());
        application.setSpecialty(req.specialty.trim());
        application.setLicenseNumber(trimToNull(req.licenseNumber));
        application.setLicenseFileUrl(requireNonBlank(req.licenseFileUrl, "License file is required"));
        application.setDiplomaFileUrl(requireNonBlank(req.diplomaFileUrl, "Diploma file is required"));
        application.setSpecialtyCertificateFileUrl(
                requireNonBlank(req.specialtyCertificateFileUrl, "Specialty certificate file is required")
        );
        application.setIdentityDocumentFileUrl(trimToNull(req.identityDocumentFileUrl));
        application.setStatus(DoctorVerificationStatus.PENDING_VERIFICATION);
        application.setReviewComment(null);

        return toResponse(applicationRepository.save(application), user.getEmail());
    }

    @Transactional(readOnly = true)
    public DoctorVerificationApplicationResponse getMine(long userId) {
        UserAccount user = findUser(userId);
        DoctorVerificationApplication application = applicationRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Doctor verification application not found"));
        return toResponse(application, user.getEmail());
    }

    @Transactional(readOnly = true)
    public List<DoctorVerificationApplicationResponse> getByStatus(String status) {
        DoctorVerificationStatus parsedStatus = parseStatus(status);
        return applicationRepository.findAllByStatusOrderByUpdatedAtDesc(parsedStatus).stream()
                .map(application -> {
                    UserAccount user = findUser(application.getUserId());
                    return toResponse(application, user.getEmail());
                })
                .toList();
    }

    @Transactional
    public DoctorVerificationApplicationResponse review(Long id, DoctorVerificationReviewRequest req) {
        DoctorVerificationApplication application = applicationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Doctor verification application not found: " + id));
        UserAccount user = findUser(application.getUserId());

        DoctorVerificationStatus targetStatus = parseStatus(req.status);
        if (targetStatus == DoctorVerificationStatus.PENDING_VERIFICATION) {
            throw new IllegalArgumentException("Cannot set status to PENDING_VERIFICATION during review");
        }

        application.setStatus(targetStatus);
        application.setReviewComment(trimToNull(req.reviewComment));

        if (targetStatus == DoctorVerificationStatus.APPROVED) {
            user.setRole(Role.DOCTOR);
            userAccountRepository.save(user);
        }

        return toResponse(applicationRepository.save(application), user.getEmail());
    }

    private UserAccount findUser(long userId) {
        return userAccountRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
    }

    private DoctorVerificationStatus parseStatus(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Status is required");
        }
        try {
            return DoctorVerificationStatus.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Unsupported status");
        }
    }

    private DoctorVerificationApplicationResponse toResponse(DoctorVerificationApplication application, String email) {
        return new DoctorVerificationApplicationResponse(
                application.getId(),
                application.getUserId(),
                email,
                application.getFullName(),
                application.getSpecialty(),
                application.getLicenseNumber(),
                application.getLicenseFileUrl(),
                application.getDiplomaFileUrl(),
                application.getSpecialtyCertificateFileUrl(),
                application.getIdentityDocumentFileUrl(),
                application.getStatus().name(),
                application.getReviewComment(),
                application.getCreatedAt(),
                application.getUpdatedAt()
        );
    }

    private String requireNonBlank(String value, String errorMessage) {
        String trimmed = trimToNull(value);
        if (trimmed == null) {
            throw new IllegalArgumentException(errorMessage);
        }
        return trimmed;
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
