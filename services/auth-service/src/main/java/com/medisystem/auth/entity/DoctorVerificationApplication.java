package com.medisystem.auth.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;

@Entity
@Table(
        name = "doctor_verification_applications",
        uniqueConstraints = @UniqueConstraint(columnNames = "user_id")
)
public class DoctorVerificationApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(nullable = false)
    private String specialty;

    @Column(name = "license_number")
    private String licenseNumber;

    @Column(name = "license_file_url", columnDefinition = "text")
    private String licenseFileUrl;

    @Column(name = "diploma_file_url", columnDefinition = "text")
    private String diplomaFileUrl;

    @Column(name = "specialty_certificate_file_url", columnDefinition = "text")
    private String specialtyCertificateFileUrl;

    @Column(name = "identity_document_file_url", columnDefinition = "text")
    private String identityDocumentFileUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DoctorVerificationStatus status = DoctorVerificationStatus.PENDING_VERIFICATION;

    @Column(name = "review_comment", columnDefinition = "text")
    private String reviewComment;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    public Long getId() {
        return id;
    }

    public Long getUserId() {
        return userId;
    }

    public String getFullName() {
        return fullName;
    }

    public String getSpecialty() {
        return specialty;
    }

    public String getLicenseNumber() {
        return licenseNumber;
    }

    public String getLicenseFileUrl() {
        return licenseFileUrl;
    }

    public String getDiplomaFileUrl() {
        return diplomaFileUrl;
    }

    public String getSpecialtyCertificateFileUrl() {
        return specialtyCertificateFileUrl;
    }

    public String getIdentityDocumentFileUrl() {
        return identityDocumentFileUrl;
    }

    public DoctorVerificationStatus getStatus() {
        return status;
    }

    public String getReviewComment() {
        return reviewComment;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public void setSpecialty(String specialty) {
        this.specialty = specialty;
    }

    public void setLicenseNumber(String licenseNumber) {
        this.licenseNumber = licenseNumber;
    }

    public void setLicenseFileUrl(String licenseFileUrl) {
        this.licenseFileUrl = licenseFileUrl;
    }

    public void setDiplomaFileUrl(String diplomaFileUrl) {
        this.diplomaFileUrl = diplomaFileUrl;
    }

    public void setSpecialtyCertificateFileUrl(String specialtyCertificateFileUrl) {
        this.specialtyCertificateFileUrl = specialtyCertificateFileUrl;
    }

    public void setIdentityDocumentFileUrl(String identityDocumentFileUrl) {
        this.identityDocumentFileUrl = identityDocumentFileUrl;
    }

    public void setStatus(DoctorVerificationStatus status) {
        this.status = status;
    }

    public void setReviewComment(String reviewComment) {
        this.reviewComment = reviewComment;
    }
}
