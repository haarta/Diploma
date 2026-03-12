package com.medisystem.appointment.service;

import com.medisystem.appointment.dto.admin.AdminPromotionUpsertRequest;
import com.medisystem.appointment.dto.shared.PromotionCardResponse;
import com.medisystem.appointment.entity.Promotion;
import com.medisystem.appointment.exception.PromotionNotFoundException;
import com.medisystem.appointment.repo.PromotionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PromotionService {

    private final PromotionRepository promotionRepository;

    public PromotionService(PromotionRepository promotionRepository) {
        this.promotionRepository = promotionRepository;
    }

    @Transactional(readOnly = true)
    public List<PromotionCardResponse> getPublicPromotions() {
        return promotionRepository.findAllByPublishedTrueOrderByActiveFromDescIdDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public PromotionCardResponse getPublicPromotion(Long id) {
        Promotion promotion = getPromotion(id);
        if (!promotion.isPublished()) {
            throw new PromotionNotFoundException("Promotion not found: " + id);
        }
        return toResponse(promotion);
    }

    @Transactional(readOnly = true)
    public List<PromotionCardResponse> getAdminPromotions() {
        return promotionRepository.findAllByOrderByCreatedAtDescIdDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public PromotionCardResponse getAdminPromotion(Long id) {
        return toResponse(getPromotion(id));
    }

    @Transactional
    public PromotionCardResponse createPromotion(AdminPromotionUpsertRequest req) {
        validateDates(req);
        Promotion promotion = new Promotion();
        applyFields(promotion, req);
        return toResponse(promotionRepository.save(promotion));
    }

    @Transactional
    public PromotionCardResponse updatePromotion(Long id, AdminPromotionUpsertRequest req) {
        validateDates(req);
        Promotion promotion = getPromotion(id);
        applyFields(promotion, req);
        return toResponse(promotionRepository.save(promotion));
    }

    @Transactional
    public void deletePromotion(Long id) {
        promotionRepository.delete(getPromotion(id));
    }

    private Promotion getPromotion(Long id) {
        return promotionRepository.findById(id)
                .orElseThrow(() -> new PromotionNotFoundException("Promotion not found: " + id));
    }

    private void validateDates(AdminPromotionUpsertRequest req) {
        if (req.activeFrom() != null && req.activeTo() != null && req.activeTo().isBefore(req.activeFrom())) {
            throw new IllegalArgumentException("Дата окончания акции не может быть раньше даты начала.");
        }
    }

    private void applyFields(Promotion promotion, AdminPromotionUpsertRequest req) {
        promotion.setTitle(req.title().trim());
        promotion.setShortDescription(req.shortDescription().trim());
        promotion.setDescription(trimToNull(req.description()));
        promotion.setImageUrl(trimToNull(req.imageUrl()));
        promotion.setButtonText(trimToNull(req.buttonText()));
        promotion.setButtonLink(trimToNull(req.buttonLink()));
        promotion.setActiveFrom(req.activeFrom());
        promotion.setActiveTo(req.activeTo());
        promotion.setPublished(req.published());
    }

    private PromotionCardResponse toResponse(Promotion promotion) {
        return new PromotionCardResponse(
                promotion.getId(),
                promotion.getTitle(),
                promotion.getShortDescription(),
                promotion.getDescription(),
                promotion.getImageUrl(),
                promotion.getButtonText(),
                promotion.getButtonLink(),
                promotion.getActiveFrom(),
                promotion.getActiveTo(),
                promotion.isPublished()
        );
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
