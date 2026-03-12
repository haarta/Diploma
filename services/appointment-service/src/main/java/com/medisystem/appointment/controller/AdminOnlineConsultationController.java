package com.medisystem.appointment.controller;

import com.medisystem.appointment.dto.admin.AdminOnlineConsultationUpsertRequest;
import com.medisystem.appointment.dto.shared.OnlineConsultationCardResponse;
import com.medisystem.appointment.service.OnlineConsultationService;
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
@RequestMapping("/api/admin/online-consultations")
public class AdminOnlineConsultationController {

    private final OnlineConsultationService service;

    public AdminOnlineConsultationController(OnlineConsultationService service) {
        this.service = service;
    }

    @GetMapping
    public List<OnlineConsultationCardResponse> getAll() {
        return service.getAdminItems();
    }

    @GetMapping("/{id}")
    public OnlineConsultationCardResponse getById(@PathVariable Long id) {
        return service.getAdminItem(id);
    }

    @PostMapping
    public OnlineConsultationCardResponse create(@Valid @RequestBody AdminOnlineConsultationUpsertRequest req) {
        return service.create(req);
    }

    @PutMapping("/{id}")
    public OnlineConsultationCardResponse update(@PathVariable Long id, @Valid @RequestBody AdminOnlineConsultationUpsertRequest req) {
        return service.update(id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
