package com.medisystem.appointment.controller;

import com.medisystem.appointment.dto.doctor.DoctorMedicalDocumentResponse;
import com.medisystem.appointment.dto.doctor.DoctorUpcomingAppointmentResponse;
import com.medisystem.appointment.security.UserPrincipal;
import com.medisystem.appointment.service.DoctorWorkspaceService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/doctor")
public class DoctorWorkspaceController {

    private final DoctorWorkspaceService doctorWorkspaceService;

    public DoctorWorkspaceController(DoctorWorkspaceService doctorWorkspaceService) {
        this.doctorWorkspaceService = doctorWorkspaceService;
    }

    @GetMapping("/appointments/upcoming")
    public List<DoctorUpcomingAppointmentResponse> getUpcomingAppointments(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return doctorWorkspaceService.getUpcomingAppointments(principal.getUserId());
    }

    @GetMapping("/documents")
    public List<DoctorMedicalDocumentResponse> getDocuments(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(name = "appointmentId", required = false) Long appointmentId
    ) {
        return doctorWorkspaceService.getDocuments(principal.getUserId(), appointmentId);
    }

    @PostMapping("/documents/upload")
    public DoctorMedicalDocumentResponse uploadDocument(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam("appointmentId") Long appointmentId,
            @RequestParam(name = "type", defaultValue = "OTHER") String type,
            @RequestParam("file") MultipartFile file
    ) {
        return doctorWorkspaceService.uploadDocument(principal.getUserId(), appointmentId, type, file);
    }
}
