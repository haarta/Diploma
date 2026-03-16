package com.medisystem.appointment.controller;

import com.medisystem.appointment.dto.publicapi.PublicBusyAppointmentSlotResponse;
import com.medisystem.appointment.service.AppointmentService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/public/appointments")
public class PublicAppointmentController {

    private final AppointmentService appointmentService;

    public PublicAppointmentController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

    @GetMapping("/busy")
    public List<PublicBusyAppointmentSlotResponse> getBusySlots(
            @RequestParam Long doctorId,
            @RequestParam(name = "dateFrom", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(name = "dateTo", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo
    ) {
        return appointmentService.getBusySlots(doctorId, dateFrom, dateTo);
    }
}
