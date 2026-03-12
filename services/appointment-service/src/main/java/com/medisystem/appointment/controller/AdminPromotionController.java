package com.medisystem.appointment.controller;

import com.medisystem.appointment.dto.admin.AdminPromotionUpsertRequest;
import com.medisystem.appointment.dto.shared.PromotionCardResponse;
import com.medisystem.appointment.service.PromotionService;
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
@RequestMapping("/api/admin/promotions")
public class AdminPromotionController {

    private final PromotionService service;

    public AdminPromotionController(PromotionService service) {
        this.service = service;
    }

    @GetMapping
    public List<PromotionCardResponse> getAll() {
        return service.getAdminPromotions();
    }

    @GetMapping("/{id}")
    public PromotionCardResponse getById(@PathVariable Long id) {
        return service.getAdminPromotion(id);
    }

    @PostMapping
    public PromotionCardResponse create(@Valid @RequestBody AdminPromotionUpsertRequest req) {
        return service.createPromotion(req);
    }

    @PutMapping("/{id}")
    public PromotionCardResponse update(@PathVariable Long id, @Valid @RequestBody AdminPromotionUpsertRequest req) {
        return service.updatePromotion(id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.deletePromotion(id);
    }
}
