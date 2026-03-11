package com.medisystem.appointment.controller;

import com.medisystem.appointment.dto.shared.DoctorCardResponse;
import com.medisystem.appointment.service.DoctorService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/doctors")
public class DoctorController {

    private final DoctorService service;

    public DoctorController(DoctorService service) {
        this.service = service;
    }

    @GetMapping
    public List<DoctorCardResponse> getAll() {
        return service.getPublicDoctors();
    }
}
