package com.medisystem.appointment.service;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;

@Service
public class VisitReportTemplateService {

    public VisitReportTemplate resolve(String specialty) {
        String normalized = specialty == null ? "" : specialty.toLowerCase(Locale.ROOT);

        if (normalized.contains("аллерг")) {
            return new VisitReportTemplate(
                    "Аллергология",
                    "Проведена консультация врача-аллерголога с оценкой триггеров, сезонности симптомов и рисков обострения.",
                    "Рекомендовано избегать контакта с вероятными аллергенами, вести дневник симптомов и рассмотреть плановую аллергодиагностику."
            );
        }

        if (normalized.contains("карди")) {
            return new VisitReportTemplate(
                    "Кардиология",
                    "Проведена кардиологическая консультация с оценкой жалоб, факторов риска и необходимости дообследования.",
                    "Рекомендован контроль артериального давления, ограничение перегрузок и выполнение кардиологических обследований по назначению."
            );
        }

        if (normalized.contains("терап")) {
            return new VisitReportTemplate(
                    "Терапия",
                    "Проведен первичный терапевтический осмотр с уточнением жалоб, анамнеза и общего соматического статуса.",
                    "Рекомендовано динамическое наблюдение, выполнение базовых анализов и повторная консультация при сохранении симптомов."
            );
        }

        if (normalized.contains("лор") || normalized.contains("отолар")) {
            return new VisitReportTemplate(
                    "Оториноларингология",
                    "Проведен осмотр ЛОР-органов с оценкой местного статуса, выраженности симптомов и необходимости дополнительной терапии.",
                    "Рекомендовано щадящее лечение по профилю, контроль симптомов и повторный осмотр при отсутствии положительной динамики."
            );
        }

        if (normalized.contains("невр")) {
            return new VisitReportTemplate(
                    "Неврология",
                    "Проведена неврологическая консультация с оценкой жалоб, функционального статуса и показаний к инструментальной диагностике.",
                    "Рекомендовано соблюдение режима сна и отдыха, снижение перегрузок и выполнение неврологических обследований по показаниям."
            );
        }

        return new VisitReportTemplate(
                specialty == null || specialty.isBlank() ? "Амбулаторный прием" : specialty,
                "Проведен амбулаторный прием профильного специалиста с анализом жалоб, анамнеза и текущего состояния пациента.",
                "Рекомендовано следовать назначениям лечащего врача и пройти дополнительные обследования при необходимости."
        );
    }

    public record VisitReportTemplate(
            String title,
            String intro,
            String defaultPlan
    ) {
        public List<String> summaryBullets() {
            return List.of(intro, defaultPlan);
        }
    }
}
