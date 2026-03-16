package com.medisystem.appointment.controller;

import com.medisystem.appointment.dto.admin.FileUploadResponse;
import com.medisystem.appointment.security.UserPrincipal;
import com.medisystem.appointment.service.FileStorageService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/files")
public class UserFileController {

    private final FileStorageService storageService;

    public UserFileController(FileStorageService storageService) {
        this.storageService = storageService;
    }

    @PostMapping("/upload")
    public FileUploadResponse upload(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam("file") MultipartFile file,
            @RequestParam(name = "folder", defaultValue = "misc") String folder
    ) {
        String scopedFolder = "users/" + principal.getUserId() + "/" + folder;
        return storageService.upload(file, scopedFolder);
    }
}
