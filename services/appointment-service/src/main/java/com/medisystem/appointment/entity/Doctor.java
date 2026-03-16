package com.medisystem.appointment.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "doctors")
public class Doctor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(name = "user_id", unique = true)
    private Long userId;

    @Column(nullable = false)
    private String specialty;

    @Column(name = "experience_years")
    private Integer experienceYears;

    @Column(name = "photo_url")
    private String photoUrl;

    @Column(columnDefinition = "text")
    private String description;

    @Column(name = "branch_name")
    private String branch;

    @Column(nullable = false)
    private boolean published = false;

    @OneToMany(mappedBy = "doctor", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<DoctorPrice> prices = new ArrayList<>();

    @OneToMany(mappedBy = "doctor", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<DoctorSchedule> schedules = new ArrayList<>();

    @OneToMany(mappedBy = "doctor", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<DoctorCertificate> certificates = new ArrayList<>();

    @OneToMany(mappedBy = "doctor", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<DoctorReview> reviews = new ArrayList<>();

    public Long getId() {
        return id;
    }

    public String getFullName() {
        return fullName;
    }

    public String getSpecialty() {
        return specialty;
    }

    public Long getUserId() {
        return userId;
    }

    public Integer getExperienceYears() {
        return experienceYears;
    }

    public String getPhotoUrl() {
        return photoUrl;
    }

    public String getDescription() {
        return description;
    }

    public String getBranch() {
        return branch;
    }

    public boolean isPublished() {
        return published;
    }

    public List<DoctorPrice> getPrices() {
        return prices;
    }

    public List<DoctorSchedule> getSchedules() {
        return schedules;
    }

    public List<DoctorCertificate> getCertificates() {
        return certificates;
    }

    public List<DoctorReview> getReviews() {
        return reviews;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public void setSpecialty(String specialty) {
        this.specialty = specialty;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public void setExperienceYears(Integer experienceYears) {
        this.experienceYears = experienceYears;
    }

    public void setPhotoUrl(String photoUrl) {
        this.photoUrl = photoUrl;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public void setBranch(String branch) {
        this.branch = branch;
    }

    public void setPublished(boolean published) {
        this.published = published;
    }
}
