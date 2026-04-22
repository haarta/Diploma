package com.medisystem.appointment.controller;

import com.medisystem.appointment.dto.admin.AdminNewsItemUpsertRequest;
import com.medisystem.appointment.dto.shared.NewsCardResponse;
import com.medisystem.appointment.service.NewsService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

import static org.springframework.http.HttpStatus.NO_CONTENT;

@RestController
@RequestMapping("/api/admin/news")
public class AdminNewsController {

    private final NewsService service;

    public AdminNewsController(NewsService service) {
        this.service = service;
    }

    @GetMapping
    public List<NewsCardResponse> getAll() {
        return service.getAdminItems();
    }

    @GetMapping("/{id}")
    public NewsCardResponse getById(@PathVariable Long id) {
        return service.getAdminItem(id);
    }

    @PostMapping
    public NewsCardResponse create(@Valid @RequestBody AdminNewsItemUpsertRequest req) {
        return service.create(req);
    }

    @PutMapping("/{id}")
    public NewsCardResponse update(@PathVariable Long id, @Valid @RequestBody AdminNewsItemUpsertRequest req) {
        return service.update(id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
