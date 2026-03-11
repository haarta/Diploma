package com.medisystem.appointment.service;

import com.medisystem.appointment.config.StorageProperties;
import com.medisystem.appointment.dto.admin.FileUploadResponse;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.Locale;
import java.util.UUID;

@Service
public class FileStorageService {

    private final MinioClient minioClient;
    private final StorageProperties storage;

    public FileStorageService(MinioClient minioClient, StorageProperties storage) {
        this.minioClient = minioClient;
        this.storage = storage;
    }

    public FileUploadResponse upload(MultipartFile file, String folder) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is required");
        }

        String safeFolder = normalizeFolder(folder);
        String extension = resolveExtension(file.getOriginalFilename());
        String objectKey = safeFolder + "/" + UUID.randomUUID() + extension;

        try {
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(storage.bucket())
                            .object(objectKey)
                            .stream(file.getInputStream(), file.getSize(), -1)
                            .contentType(file.getContentType())
                            .build()
            );
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to upload file to object storage", ex);
        }

        String publicUrl = trimTrailingSlash(storage.publicUrl());
        String url = publicUrl + "/" + storage.bucket() + "/" + objectKey;
        return new FileUploadResponse(objectKey, url, file.getContentType(), file.getSize());
    }

    private String normalizeFolder(String folder) {
        if (folder == null || folder.isBlank()) {
            return "misc";
        }
        return folder.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9/_-]", "-");
    }

    private String resolveExtension(String originalFilename) {
        if (originalFilename == null || originalFilename.isBlank()) {
            return "";
        }
        String fileName = originalFilename.replace("\\", "/");
        int slashIdx = fileName.lastIndexOf('/');
        if (slashIdx >= 0) {
            fileName = fileName.substring(slashIdx + 1);
        }
        int dotIdx = fileName.lastIndexOf('.');
        if (dotIdx < 0 || dotIdx == fileName.length() - 1) {
            return "";
        }
        String ext = fileName.substring(dotIdx).toLowerCase(Locale.ROOT);
        if (!ext.matches("\\.[a-z0-9]{1,10}")) {
            return "";
        }
        return ext;
    }

    private String trimTrailingSlash(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        int end = value.length();
        while (end > 0 && value.charAt(end - 1) == '/') {
            end--;
        }
        return value.substring(0, end);
    }
}
