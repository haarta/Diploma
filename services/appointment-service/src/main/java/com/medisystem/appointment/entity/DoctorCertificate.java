package com.medisystem.appointment.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.LocalDate;

@Entity
@Table(name = "doctor_certificates")
public class DoctorCertificate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id", nullable = false)
    private Doctor doctor;

    @Column(nullable = false)
    private String title;

    @Column(name = "issued_by")
    private String issuer;

    @Column(name = "issued_at")
    private LocalDate issuedAt;

    @Column(name = "file_url")
    private String fileUrl;

    public Long getId() {
        return id;
    }

    public Doctor getDoctor() {
        return doctor;
    }

    public String getTitle() {
        return title;
    }

    public String getIssuer() {
        return issuer;
    }

    public LocalDate getIssuedAt() {
        return issuedAt;
    }

    public String getFileUrl() {
        return fileUrl;
    }

    public void setDoctor(Doctor doctor) {
        this.doctor = doctor;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public void setIssuer(String issuer) {
        this.issuer = issuer;
    }

    public void setIssuedAt(LocalDate issuedAt) {
        this.issuedAt = issuedAt;
    }

    public void setFileUrl(String fileUrl) {
        this.fileUrl = fileUrl;
    }
}
