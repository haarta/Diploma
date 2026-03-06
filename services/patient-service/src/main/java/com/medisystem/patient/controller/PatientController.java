package com.medisystem.patient.controller;

import com.medisystem.patient.dto.PatientCreateRequest;
import com.medisystem.patient.dto.PatientResponse;
import com.medisystem.patient.dto.PatientUpdateRequest;
import com.medisystem.patient.entity.Patient;
import com.medisystem.patient.service.PatientService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import static org.springframework.http.HttpStatus.NO_CONTENT;

@RestController
@RequestMapping("/api/patients")
public class PatientController {

    private final PatientService service;

    public PatientController(PatientService service) {
        this.service = service;
    }

    @PostMapping
    public PatientResponse create(@Valid @RequestBody PatientCreateRequest req) {
        return toResponse(service.create(req));
    }

    @GetMapping("/{id}")
    public PatientResponse get(@PathVariable Long id) {
        return toResponse(service.get(id));
    }

    @GetMapping("/by-user/{userId}")
    public PatientResponse getByUserId(@PathVariable Long userId) {
        return toResponse(service.getByUserId(userId));
    }

    @GetMapping
    public Page<PatientResponse> list(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String phone,
            @RequestParam(required = false, defaultValue = "true") Boolean active,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "20") int size,
            @RequestParam(required = false, defaultValue = "id,desc") String sort
    ) {
        Sort sortObj = parseSort(sort);
        var pageable = PageRequest.of(page, size, sortObj);
        return service.list(q, phone, active, pageable).map(this::toResponse);
    }

    @PatchMapping("/{id}")
    public PatientResponse patch(@PathVariable Long id, @Valid @RequestBody PatientUpdateRequest req) {
        return toResponse(service.patch(id, req));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.softDelete(id);
    }

    private Sort parseSort(String sort) {
        String[] parts = sort.split(",");
        String field = parts[0];
        Sort.Direction direction = (parts.length > 1 && "asc".equalsIgnoreCase(parts[1]))
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;
        return Sort.by(direction, field);
    }

    private PatientResponse toResponse(Patient p) {
        return new PatientResponse(
                p.getId(),
                p.getUserId(),
                p.getFullName(),
                p.getBirthDate(),
                p.getPhone(),
                p.getEmail(),
                p.getGender(),
                p.getAddress(),
                p.getAllergies(),
                p.getChronicConditions(),
                p.getBloodGroup(),
                p.getRhFactor(),
                p.getEmergencyContactName(),
                p.getEmergencyContactPhone(),
                p.isActive(),
                p.getCreatedAt(),
                p.getUpdatedAt()
        );
    }
}
