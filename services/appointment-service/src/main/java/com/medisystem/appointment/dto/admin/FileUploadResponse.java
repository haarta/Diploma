package com.medisystem.appointment.dto.admin;

public record FileUploadResponse(
        String key,
        String url,
        String contentType,
        long size
) {
}
