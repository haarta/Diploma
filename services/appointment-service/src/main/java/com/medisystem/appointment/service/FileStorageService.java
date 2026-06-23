package com.medisystem.appointment.service;

import com.medisystem.appointment.config.StorageProperties;
import com.medisystem.appointment.dto.admin.FileUploadResponse;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
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
            throw new IllegalArgumentException("Необходимо выбрать файл");
        }

        return uploadBytes(readFileBytes(file), folder, file.getOriginalFilename(), file.getContentType());
    }

    public FileUploadResponse uploadBytes(byte[] content, String folder, String originalFilename, String contentType) {
        if (content == null || content.length == 0) {
            throw new IllegalArgumentException("Необходимо передать непустой файл");
        }

        String safeFolder = normalizeFolder(folder);
        String extension = resolveExtension(originalFilename);
        String objectKey = safeFolder + "/" + UUID.randomUUID() + extension;

        try {
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(storage.bucket())
                            .object(objectKey)
                            .stream(new ByteArrayInputStream(content), content.length, -1)
                            .contentType(contentType)
                            .build()
            );
        } catch (Exception ex) {
            throw new IllegalStateException("Не удалось загрузить файл в объектное хранилище", ex);
        }

        String publicUrl = trimTrailingSlash(storage.publicUrl());
        String url = publicUrl + "/" + storage.bucket() + "/" + objectKey;
        return new FileUploadResponse(objectKey, url, contentType, content.length);
    }

    private byte[] readFileBytes(MultipartFile file) {
        try {
            return file.getBytes();
        } catch (Exception ex) {
            throw new IllegalStateException("Не удалось прочитать файл перед загрузкой", ex);
        }
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
