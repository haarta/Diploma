package com.medisystem.patient.controller;

import com.medisystem.patient.dto.PatientCreateRequest;
import com.medisystem.patient.dto.PatientResponse;
import com.medisystem.patient.service.PatientService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/patients")
public class PatientController {

    private final PatientService service;

    public PatientController(PatientService service) {
        this.service = service;
    }

    @PostMapping
    public PatientResponse create(@Valid @RequestBody PatientCreateRequest req) {
        var p = service.create(req);
        return new PatientResponse(p.getId(), p.getUserId(), p.getFullName(), p.getBirthDate(), p.getPhone());
    }

    @GetMapping("/{id}")
    public PatientResponse get(@PathVariable Long id) {
        var p = service.get(id);
        return new PatientResponse(p.getId(), p.getUserId(), p.getFullName(), p.getBirthDate(), p.getPhone());
    }

    @GetMapping("/by-user/{userId}")
    public PatientResponse getByUserId(@PathVariable Long userId) {
        var p = service.getByUserId(userId);
        return new PatientResponse(p.getId(), p.getUserId(), p.getFullName(), p.getBirthDate(), p.getPhone());
    }
}