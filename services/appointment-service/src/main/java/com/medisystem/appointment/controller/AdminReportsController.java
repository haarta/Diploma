package com.medisystem.appointment.controller;

import com.medisystem.appointment.dto.admin.AdminAnalyticsResponse;
import com.medisystem.appointment.service.AdminAnalyticsService;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/reports")
public class AdminReportsController {

    private final AdminAnalyticsService adminAnalyticsService;

    public AdminReportsController(AdminAnalyticsService adminAnalyticsService) {
        this.adminAnalyticsService = adminAnalyticsService;
    }

    @GetMapping("/dashboard")
    public AdminAnalyticsResponse getDashboard(
            @RequestParam(required = false) Integer days,
            @RequestParam(required = false) Long doctorId,
            @RequestParam(required = false) String specialty,
            @RequestParam(required = false) String status
    ) {
        return adminAnalyticsService.getDashboard(days, doctorId, specialty, status);
    }

    @GetMapping("/export.xlsx")
    public ResponseEntity<byte[]> exportExcel(
            @RequestParam(required = false) Integer days,
            @RequestParam(required = false) Long doctorId,
            @RequestParam(required = false) String specialty,
            @RequestParam(required = false) String status
    ) {
        byte[] body = adminAnalyticsService.exportExcel(days, doctorId, specialty, status);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename("analytics.xlsx").build().toString())
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(body);
    }

    @GetMapping("/export.pdf")
    public ResponseEntity<byte[]> exportPdf(
            @RequestParam(required = false) Integer days,
            @RequestParam(required = false) Long doctorId,
            @RequestParam(required = false) String specialty,
            @RequestParam(required = false) String status
    ) {
        byte[] body = adminAnalyticsService.exportPdf(days, doctorId, specialty, status);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename("analytics.pdf").build().toString())
                .contentType(MediaType.APPLICATION_PDF)
                .body(body);
    }
}
