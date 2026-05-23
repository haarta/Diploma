package com.medisystem.appointment.controller;

import com.medisystem.appointment.dto.AppointmentCreateRequest;
import com.medisystem.appointment.dto.AppointmentResponse;
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
import org.springframework.web.bind.annotation.PatchMapping;
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
    public List<AppointmentResponse> getMine(@AuthenticationPrincipal UserPrincipal principal) {
        return service.getMine(principal.getUserId()).stream()
                .map(this::toResponse)
                .toList();
    }

    @PostMapping("/me")
    public AppointmentResponse createMine(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody AppointmentCreateRequest req
    ) {
        return toResponse(service.createMine(principal.getUserId(), req));
    }

    @PatchMapping("/me/{id}/cancel")
    public AppointmentResponse cancelMine(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    ) {
        return toResponse(service.cancelMine(principal.getUserId(), id));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<AppointmentResponse> getAll() {
        return service.getAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public AppointmentResponse getById(@PathVariable Long id) {
        return toResponse(service.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public AppointmentResponse create(@Valid @RequestBody AppointmentCreateRequest req) {
        return toResponse(service.create(req));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public AppointmentResponse update(@PathVariable Long id, @Valid @RequestBody AppointmentUpdateRequest req) {
        return toResponse(service.update(id, req));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }

    private AppointmentResponse toResponse(Appointment appointment) {
        return new AppointmentResponse(
                appointment.getId(),
                appointment.getPatientId(),
                appointment.getPatientFullName(),
                appointment.getPatientEmail(),
                appointment.getDoctorId(),
                appointment.getAppointmentDate(),
                appointment.getAppointmentTime(),
                appointment.getServiceName(),
                appointment.getServicePrice(),
                appointment.getServiceCurrency(),
                appointment.getStatus().name(),
                appointment.getNotes(),
                appointment.getCompletionSummary(),
                appointment.getCompletedAt()
        );
    }
}
