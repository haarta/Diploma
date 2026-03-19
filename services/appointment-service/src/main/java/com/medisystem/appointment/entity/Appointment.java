package com.medisystem.appointment.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDate;
import java.time.LocalTime;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "appointments")
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "patient_id", nullable = false)
    private Long patientId;

    @Column(name = "created_by_user_id")
    private Long createdByUserId;

    @Column(name = "patient_full_name")
    private String patientFullName;

    @Column(name = "patient_email")
    private String patientEmail;

    @Column(name = "doctor_id", nullable = false)
    private Long doctorId;

    @Column(name = "appointment_date", nullable = false)
    private LocalDate appointmentDate;

    @Column(name = "appointment_time", nullable = false)
    private LocalTime appointmentTime;

    @Column(name = "service_name", nullable = false)
    private String serviceName;

    @Column(name = "service_price", precision = 10, scale = 2)
    private BigDecimal servicePrice;

    @Column(name = "service_currency")
    private String serviceCurrency;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AppointmentStatus status = AppointmentStatus.SCHEDULED;

    @Column(columnDefinition = "text")
    private String notes;

    @Column(name = "completion_summary", columnDefinition = "text")
    private String completionSummary;

    @Column(name = "completed_at")
    private OffsetDateTime completedAt;

    @Column(name = "reminder_24h_sent_at")
    private OffsetDateTime reminder24hSentAt;

    @Column(name = "reminder_2h_sent_at")
    private OffsetDateTime reminder2hSentAt;

    public Long getId() {
        return id;
    }

    public Long getPatientId() {
        return patientId;
    }

    public Long getDoctorId() {
        return doctorId;
    }

    public Long getCreatedByUserId() {
        return createdByUserId;
    }

    public String getPatientFullName() {
        return patientFullName;
    }

    public String getPatientEmail() {
        return patientEmail;
    }

    public LocalDate getAppointmentDate() {
        return appointmentDate;
    }

    public LocalTime getAppointmentTime() {
        return appointmentTime;
    }

    public String getServiceName() {
        return serviceName;
    }

    public BigDecimal getServicePrice() {
        return servicePrice;
    }

    public String getServiceCurrency() {
        return serviceCurrency;
    }

    public AppointmentStatus getStatus() {
        return status;
    }

    public String getNotes() {
        return notes;
    }

    public String getCompletionSummary() {
        return completionSummary;
    }

    public OffsetDateTime getCompletedAt() {
        return completedAt;
    }

    public OffsetDateTime getReminder24hSentAt() {
        return reminder24hSentAt;
    }

    public OffsetDateTime getReminder2hSentAt() {
        return reminder2hSentAt;
    }

    public void setPatientId(Long patientId) {
        this.patientId = patientId;
    }

    public void setDoctorId(Long doctorId) {
        this.doctorId = doctorId;
    }

    public void setCreatedByUserId(Long createdByUserId) {
        this.createdByUserId = createdByUserId;
    }

    public void setPatientFullName(String patientFullName) {
        this.patientFullName = patientFullName;
    }

    public void setPatientEmail(String patientEmail) {
        this.patientEmail = patientEmail;
    }

    public void setAppointmentDate(LocalDate appointmentDate) {
        this.appointmentDate = appointmentDate;
    }

    public void setAppointmentTime(LocalTime appointmentTime) {
        this.appointmentTime = appointmentTime;
    }

    public void setServiceName(String serviceName) {
        this.serviceName = serviceName;
    }

    public void setServicePrice(BigDecimal servicePrice) {
        this.servicePrice = servicePrice;
    }

    public void setServiceCurrency(String serviceCurrency) {
        this.serviceCurrency = serviceCurrency;
    }

    public void setStatus(AppointmentStatus status) {
        this.status = status;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public void setCompletionSummary(String completionSummary) {
        this.completionSummary = completionSummary;
    }

    public void setCompletedAt(OffsetDateTime completedAt) {
        this.completedAt = completedAt;
    }

    public void setReminder24hSentAt(OffsetDateTime reminder24hSentAt) {
        this.reminder24hSentAt = reminder24hSentAt;
    }

    public void setReminder2hSentAt(OffsetDateTime reminder2hSentAt) {
        this.reminder2hSentAt = reminder2hSentAt;
    }
}
