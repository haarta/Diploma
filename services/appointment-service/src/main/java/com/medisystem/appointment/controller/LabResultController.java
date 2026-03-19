package com.medisystem.appointment.controller;

import com.medisystem.appointment.dto.LabResultResponse;
import com.medisystem.appointment.security.UserPrincipal;
import com.medisystem.appointment.service.LabResultService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/lab-results")
public class LabResultController {

    private final LabResultService labResultService;

    public LabResultController(LabResultService labResultService) {
        this.labResultService = labResultService;
    }

    @GetMapping("/me")
    public List<LabResultResponse> getMine(@AuthenticationPrincipal UserPrincipal principal) {
        return labResultService.getMine(principal.getUserId());
    }
}
