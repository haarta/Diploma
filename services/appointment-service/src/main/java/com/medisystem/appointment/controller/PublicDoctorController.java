package com.medisystem.appointment.controller;

import com.medisystem.appointment.dto.publicapi.PublicReviewCreateRequest;
import com.medisystem.appointment.dto.shared.DoctorCardResponse;
import com.medisystem.appointment.service.DoctorService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

import static org.springframework.http.HttpStatus.ACCEPTED;

@RestController
@RequestMapping("/api/public/doctors")
public class PublicDoctorController {

    private final DoctorService service;

    public PublicDoctorController(DoctorService service) {
        this.service = service;
    }

    @GetMapping
    public List<DoctorCardResponse> getAll() {
        return service.getPublicDoctors();
    }

    @GetMapping("/{id}")
    public DoctorCardResponse getById(@PathVariable Long id) {
        return service.getPublicDoctor(id);
    }

    @PostMapping("/{id}/reviews")
    @ResponseStatus(ACCEPTED)
    public void createReview(@PathVariable Long id, @Valid @RequestBody PublicReviewCreateRequest req) {
        service.createReview(id, req);
    }
}
