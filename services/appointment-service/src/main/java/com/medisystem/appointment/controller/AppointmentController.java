package com.medisystem.appointment.controller;

import com.medisystem.appointment.dto.AppointmentCreateRequest;
import com.medisystem.appointment.dto.AppointmentUpdateRequest;
import com.medisystem.appointment.entity.Appointment;
import com.medisystem.appointment.security.UserPrincipal;
import com.medisystem.appointment.service.AppointmentService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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
@RequestMapping("/api/appointments")
public class AppointmentController {

    private final AppointmentService service;

    public AppointmentController(AppointmentService service) {
        this.service = service;
    }

    @GetMapping("/me")
    public List<Appointment> getMine(@AuthenticationPrincipal UserPrincipal principal) {
        return service.getMine(principal.getUserId());
    }

    @PostMapping("/me")
    public Appointment createMine(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody AppointmentCreateRequest req
    ) {
        return service.createMine(principal.getUserId(), req);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<Appointment> getAll() {
        return service.getAll();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Appointment getById(@PathVariable Long id) {
        return service.getById(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Appointment create(@Valid @RequestBody AppointmentCreateRequest req) {
        return service.create(req);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Appointment update(@PathVariable Long id, @Valid @RequestBody AppointmentUpdateRequest req) {
        return service.update(id, req);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
