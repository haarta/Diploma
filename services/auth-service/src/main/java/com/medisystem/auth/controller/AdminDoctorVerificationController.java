package com.medisystem.auth.controller;

import com.medisystem.auth.dto.DoctorVerificationApplicationResponse;
import com.medisystem.auth.dto.DoctorVerificationReviewRequest;
import com.medisystem.auth.service.DoctorVerificationService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/doctor-verifications")
public class AdminDoctorVerificationController {

    private final DoctorVerificationService doctorVerificationService;

    public AdminDoctorVerificationController(DoctorVerificationService doctorVerificationService) {
        this.doctorVerificationService = doctorVerificationService;
    }

    @GetMapping
    public List<DoctorVerificationApplicationResponse> list(
            @RequestParam(defaultValue = "PENDING_VERIFICATION") String status
    ) {
        return doctorVerificationService.getByStatus(status);
    }

    @PatchMapping("/{id}/review")
    public DoctorVerificationApplicationResponse review(
            @PathVariable Long id,
            @RequestBody @Valid DoctorVerificationReviewRequest req
    ) {
        return doctorVerificationService.review(id, req);
    }
}
