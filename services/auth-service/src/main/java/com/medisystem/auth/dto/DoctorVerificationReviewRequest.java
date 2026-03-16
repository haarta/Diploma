package com.medisystem.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class DoctorVerificationReviewRequest {
    @NotBlank
    public String status;

    @Size(max = 2000)
    public String reviewComment;
}
