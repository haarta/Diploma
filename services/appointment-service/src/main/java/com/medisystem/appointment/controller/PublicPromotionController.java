package com.medisystem.appointment.controller;

import com.medisystem.appointment.dto.shared.PromotionCardResponse;
import com.medisystem.appointment.service.PromotionService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/public/promotions")
public class PublicPromotionController {

    private final PromotionService service;

    public PublicPromotionController(PromotionService service) {
        this.service = service;
    }

    @GetMapping
    public List<PromotionCardResponse> getAll() {
        return service.getPublicPromotions();
    }

    @GetMapping("/{id}")
    public PromotionCardResponse getById(@PathVariable Long id) {
        return service.getPublicPromotion(id);
    }
}
