package com.medisystem.kurs.patient;

import dto.PatientRequest;
import dto.PatientResponse;
import user.Patient;
import user.PatientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PatientService {

    private final PatientRepository patientRepository;

    public PatientResponse createPatient(PatientRequest request) {
        // Проверка уникальности номера телефона
        if (patientRepository.findByPhoneNumber(request.getPhoneNumber()).isPresent()) {
            throw new RuntimeException("Пациент с таким номером уже зарегистрирован");
        }

        Patient patient = new Patient();
        patient.setFullName(request.getFullName());
        patient.setPhoneNumber(request.getPhoneNumber());
        patient.setDateOfBirth(request.getDateOfBirth());
        patient.setMedicalHistory(request.getMedicalHistory());

        Patient savedPatient = patientRepository.save(patient);
        return mapToResponse(savedPatient);
    }

    public PatientResponse getPatient(Long id) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Пациент не найден"));
        return mapToResponse(patient);
    }

    public List<PatientResponse> getAllPatients() {
        return patientRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public PatientResponse updatePatient(Long id, PatientRequest request) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Пациент не найден"));

        patient.setFullName(request.getFullName());
        patient.setDateOfBirth(request.getDateOfBirth());
        patient.setMedicalHistory(request.getMedicalHistory());

        Patient updatedPatient = patientRepository.save(patient);
        return mapToResponse(updatedPatient);
    }

    public void deletePatient(Long id) {
        if (!patientRepository.existsById(id)) {
            throw new RuntimeException("Пациент не найден");
        }
        patientRepository.deleteById(id);
    }

    public List<PatientResponse> searchByName(String name) {
        return patientRepository.findByFullNameContainingIgnoreCase(name)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private PatientResponse mapToResponse(Patient patient) {
        PatientResponse response = new PatientResponse();
        response.setId(patient.getId());
        response.setFullName(patient.getFullName());
        response.setPhoneNumber(patient.getPhoneNumber());
        response.setDateOfBirth(patient.getDateOfBirth());
        response.setMedicalHistory(patient.getMedicalHistory());
        response.setCreatedAt(patient.getCreatedAt().toString());
        return response;
    }
}
