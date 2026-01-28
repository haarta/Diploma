package com.medisystem.kurs.patient;

import dto.PatientRequest;
import dto.PatientResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/patients")
@RequiredArgsConstructor
@CrossOrigin("*")
public class PatientController {

    private final PatientService patientService;

    @PostMapping
    public ResponseEntity<PatientResponse> createPatient(@Valid @RequestBody PatientRequest request) {
        try {
            PatientResponse response = patientService.createPatient(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            throw new RuntimeException(e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<PatientResponse> getPatient(@PathVariable Long id) {
        try {
            PatientResponse response = patientService.getPatient(id);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @GetMapping
    public ResponseEntity<List<PatientResponse>> getAllPatients() {
        List<PatientResponse> patients = patientService.getAllPatients();
        return ResponseEntity.ok(patients);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PatientResponse> updatePatient(
            @PathVariable Long id,
            @Valid @RequestBody PatientRequest request) {
        try {
            PatientResponse response = patientService.updatePatient(id, request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePatient(@PathVariable Long id) {
        try {
            patientService.deletePatient(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @GetMapping("/search")
    public ResponseEntity<List<PatientResponse>> searchPatients(@RequestParam String name) {
        List<PatientResponse> patients = patientService.searchByName(name);
        return ResponseEntity.ok(patients);
    }
}
