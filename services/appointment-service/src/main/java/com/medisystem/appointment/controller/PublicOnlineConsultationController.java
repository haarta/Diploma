package com.medisystem.appointment.controller;

import com.medisystem.appointment.dto.shared.OnlineConsultationCardResponse;
import com.medisystem.appointment.service.OnlineConsultationService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/public/online-consultations")
public class PublicOnlineConsultationController {

    private final OnlineConsultationService service;

    public PublicOnlineConsultationController(OnlineConsultationService service) {
        this.service = service;
    }

    @GetMapping
    public List<OnlineConsultationCardResponse> getAll() {
        return service.getPublicItems();
    }

    @GetMapping("/{id}")
    public OnlineConsultationCardResponse getById(@PathVariable Long id) {
        return service.getPublicItem(id);
    }
}
