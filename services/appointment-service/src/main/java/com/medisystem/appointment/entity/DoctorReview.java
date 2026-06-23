package com.medisystem.appointment.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;

@Entity
@Table(name = "doctor_reviews")
public class DoctorReview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id", nullable = false)
    private Doctor doctor;

    @Column(name = "author_name", nullable = false)
    private String authorName;

    @Column(nullable = false)
    private Integer rating;

    @Column(columnDefinition = "text", nullable = false)
    private String text;

    @Column(name = "appointment_id")
    private Long appointmentId;

    @Column(name = "created_by_user_id")
    private Long createdByUserId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReviewStatus status = ReviewStatus.PENDING;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    public Long getId() {
        return id;
    }

    public Doctor getDoctor() {
        return doctor;
    }

    public String getAuthorName() {
        return authorName;
    }

    public Integer getRating() {
        return rating;
    }

    public String getText() {
        return text;
    }

    public Long getAppointmentId() {
        return appointmentId;
    }

    public Long getCreatedByUserId() {
        return createdByUserId;
    }

    public ReviewStatus getStatus() {
        return status;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setDoctor(Doctor doctor) {
        this.doctor = doctor;
    }

    public void setAuthorName(String authorName) {
        this.authorName = authorName;
    }

    public void setRating(Integer rating) {
        this.rating = rating;
    }

    public void setText(String text) {
        this.text = text;
    }

    public void setAppointmentId(Long appointmentId) {
        this.appointmentId = appointmentId;
    }

    public void setCreatedByUserId(Long createdByUserId) {
        this.createdByUserId = createdByUserId;
    }

    public void setStatus(ReviewStatus status) {
        this.status = status;
    }
}
