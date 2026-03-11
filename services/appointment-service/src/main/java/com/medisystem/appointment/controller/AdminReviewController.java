package com.medisystem.appointment.controller;

import com.medisystem.appointment.dto.admin.ReviewStatusUpdateRequest;
import com.medisystem.appointment.dto.shared.DoctorReviewItem;
import com.medisystem.appointment.entity.ReviewStatus;
import com.medisystem.appointment.service.DoctorService;
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
@RequestMapping("/api/admin/reviews")
public class AdminReviewController {

    private final DoctorService service;

    public AdminReviewController(DoctorService service) {
        this.service = service;
    }

    @GetMapping
    public List<DoctorReviewItem> byStatus(@RequestParam(defaultValue = "PENDING") ReviewStatus status) {
        return service.getReviewsByStatus(status);
    }

    @PatchMapping("/{id}/status")
    public DoctorReviewItem updateStatus(@PathVariable Long id, @Valid @RequestBody ReviewStatusUpdateRequest req) {
        return service.updateReviewStatus(id, req.status());
    }
}
