package com.medisystem.appointment.service;

import com.medisystem.appointment.dto.LabResultResponse;
import com.medisystem.appointment.entity.LabResult;
import com.medisystem.appointment.entity.LabResultStatus;
import com.medisystem.appointment.repo.LabResultRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class LabResultService {

    private final LabResultRepository labResultRepository;

    public LabResultService(LabResultRepository labResultRepository) {
        this.labResultRepository = labResultRepository;
    }

    @Transactional(readOnly = true)
    public List<LabResultResponse> getMine(long userId) {
        List<LabResult> results = labResultRepository.findAllByUserIdOrderByOrderedAtDesc(userId);
        if (results.isEmpty()) {
            results = seedDemoResults(userId);
        }
        return results.stream()
                .map(item -> new LabResultResponse(
                        item.getId(),
                        item.getTitle(),
                        item.getCategory(),
                        item.getOrderedAt(),
                        item.getReadyAt(),
                        item.getStatus().name(),
                        item.getPdfUrl()
                ))
                .toList();
    }

    @Transactional
    protected List<LabResult> seedDemoResults(long userId) {
        LocalDateTime now = LocalDateTime.now();
        LabResult cbc = create(userId, "Общий анализ крови", "Общеклинические исследования", now.minusDays(12), now.minusDays(10), LabResultStatus.READY, "/mock-lab-results/cbc-result.pdf");
        LabResult bio = create(userId, "Биохимический анализ", "Биохимические панели", now.minusDays(7), now.minusDays(5), LabResultStatus.READY, "/mock-lab-results/biochemistry-result.pdf");
        LabResult immuno = create(userId, "Иммунологические исследования", "Аллергодиагностика", now.minusDays(1), now.plusDays(1), LabResultStatus.PROCESSING, "/mock-lab-results/immunology-result.pdf");
        return labResultRepository.saveAll(List.of(cbc, bio, immuno));
    }

    private LabResult create(
            long userId,
            String title,
            String category,
            LocalDateTime orderedAt,
            LocalDateTime readyAt,
            LabResultStatus status,
            String pdfUrl
    ) {
        LabResult result = new LabResult();
        result.setUserId(userId);
        result.setTitle(title);
        result.setCategory(category);
        result.setOrderedAt(orderedAt);
        result.setReadyAt(readyAt);
        result.setStatus(status);
        result.setPdfUrl(pdfUrl);
        return result;
    }
}
