package com.medisystem.appointment.controller;

import com.medisystem.appointment.dto.admin.FileUploadResponse;
import com.medisystem.appointment.service.FileStorageService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/admin/files")
public class AdminFileController {

    private final FileStorageService storageService;

    public AdminFileController(FileStorageService storageService) {
        this.storageService = storageService;
    }

    @PostMapping("/upload")
    public FileUploadResponse upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(name = "folder", defaultValue = "misc") String folder
    ) {
        return storageService.upload(file, folder);
    }
}
