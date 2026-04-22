package com.medisystem.appointment.controller;

import com.medisystem.appointment.dto.shared.NewsCardResponse;
import com.medisystem.appointment.service.NewsService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/public/news")
public class PublicNewsController {

    private final NewsService service;

    public PublicNewsController(NewsService service) {
        this.service = service;
    }

    @GetMapping
    public List<NewsCardResponse> getAll() {
        return service.getPublicItems();
    }

    @GetMapping("/{id}")
    public NewsCardResponse getById(@PathVariable Long id) {
        return service.getPublicItem(id);
    }
}
