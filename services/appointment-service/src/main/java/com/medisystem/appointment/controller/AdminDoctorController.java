package com.medisystem.appointment.controller;

import com.medisystem.appointment.dto.admin.AdminDoctorUpsertRequest;
import com.medisystem.appointment.dto.shared.DoctorCardResponse;
import com.medisystem.appointment.service.DoctorService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

import static org.springframework.http.HttpStatus.NO_CONTENT;

@RestController
@RequestMapping("/api/admin/doctors")
public class AdminDoctorController {

    private final DoctorService service;

    public AdminDoctorController(DoctorService service) {
        this.service = service;
    }

    @GetMapping
    public List<DoctorCardResponse> getAll() {
        return service.getAdminDoctors();
    }

    @GetMapping("/{id}")
    public DoctorCardResponse getById(@PathVariable Long id) {
        return service.getAdminDoctor(id);
    }

    @PostMapping
    public DoctorCardResponse create(@Valid @RequestBody AdminDoctorUpsertRequest req) {
        return service.createDoctor(req);
    }

    @PutMapping("/{id}")
    public DoctorCardResponse update(@PathVariable Long id, @Valid @RequestBody AdminDoctorUpsertRequest req) {
        return service.updateDoctor(id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.deleteDoctor(id);
    }
}
