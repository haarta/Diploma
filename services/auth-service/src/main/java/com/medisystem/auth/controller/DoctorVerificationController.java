package com.medisystem.auth.controller;

import com.medisystem.auth.dto.DoctorVerificationApplicationResponse;
import com.medisystem.auth.dto.DoctorVerificationSubmitRequest;
import com.medisystem.auth.security.UserPrincipal;
import com.medisystem.auth.service.DoctorVerificationService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth/doctor-verification")
public class DoctorVerificationController {

    private final DoctorVerificationService doctorVerificationService;

    public DoctorVerificationController(DoctorVerificationService doctorVerificationService) {
        this.doctorVerificationService = doctorVerificationService;
    }

    @GetMapping("/me")
    public DoctorVerificationApplicationResponse getMine(@AuthenticationPrincipal UserPrincipal principal) {
        return doctorVerificationService.getMine(principal.getUserId());
    }

    @PostMapping("/submit")
    public DoctorVerificationApplicationResponse submit(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody @Valid DoctorVerificationSubmitRequest req
    ) {
        return doctorVerificationService.submit(principal.getUserId(), req);
    }
}
