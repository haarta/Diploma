package com.medisystem.appointment.controller;

import com.medisystem.appointment.dto.doctor.PatientDocumentResponse;
import com.medisystem.appointment.security.UserPrincipal;
import com.medisystem.appointment.service.DoctorWorkspaceService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/patient-documents")
public class PatientDocumentController {

    private final DoctorWorkspaceService doctorWorkspaceService;

    public PatientDocumentController(DoctorWorkspaceService doctorWorkspaceService) {
        this.doctorWorkspaceService = doctorWorkspaceService;
    }

    @GetMapping("/me")
    public List<PatientDocumentResponse> getMine(@AuthenticationPrincipal UserPrincipal principal) {
        return doctorWorkspaceService.getPatientDocuments(principal.getUserId());
    }
}
