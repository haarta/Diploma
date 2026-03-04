package com.medisystem.patient.entity;

import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
@Table(name = "patients")
public class Patient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // позже привяжем к userId из auth-service/JWT
    @Column(name = "user_id")
    private Long userId;

    @Column(nullable = false)
    private String fullName;

    private LocalDate birthDate;

    private String phone;

    public Patient() {}

    public Patient(Long userId, String fullName, LocalDate birthDate, String phone) {
        this.userId = userId;
        this.fullName = fullName;
        this.birthDate = birthDate;
        this.phone = phone;
    }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public String getFullName() { return fullName; }
    public LocalDate getBirthDate() { return birthDate; }
    public String getPhone() { return phone; }

    public void setUserId(Long userId) { this.userId = userId; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public void setBirthDate(LocalDate birthDate) { this.birthDate = birthDate; }
    public void setPhone(String phone) { this.phone = phone; }
}