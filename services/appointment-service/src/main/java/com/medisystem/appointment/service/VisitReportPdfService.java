package com.medisystem.appointment.service;

import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Font;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.BaseFont;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.medisystem.appointment.entity.Appointment;
import com.medisystem.appointment.entity.Doctor;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.Period;
import java.time.format.DateTimeFormatter;

@Service
public class VisitReportPdfService {

    private static final String CLINIC_NAME = "Частная медицинская клиника \"Здоровье\"";
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd.MM.yyyy");
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");
    private static final Color ACCENT = new Color(109, 90, 184);
    private static final Color MUTED = new Color(107, 114, 128);

    private final VisitReportTemplateService templateService;

    public VisitReportPdfService(VisitReportTemplateService templateService) {
        this.templateService = templateService;
    }

    public byte[] generate(
            Appointment appointment,
            Doctor doctor,
            PatientProfileClient.PatientProfileSnapshot patient
    ) {
        VisitReportTemplateService.VisitReportTemplate template = templateService.resolve(doctor.getSpecialty());

        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 40, 40, 42, 42);
            PdfWriter.getInstance(document, outputStream);
            document.open();

            Font titleFont = font(18, true, new Color(17, 24, 39));
            Font clinicFont = font(11, true, ACCENT);
            Font sectionFont = font(12, true, ACCENT);
            Font labelFont = font(10, true, new Color(55, 65, 81));
            Font valueFont = font(10, false, new Color(17, 24, 39));
            Font noteFont = font(9, false, MUTED);

            document.add(paragraph(CLINIC_NAME, clinicFont, 0, 0, 0, 8));
            document.add(paragraph("Заключение по результатам амбулаторного приема", titleFont, 0, 0, 0, 14));
            document.add(paragraph(template.title(), sectionFont, 0, 0, 0, 12));

            PdfPTable metaTable = new PdfPTable(new float[]{1f, 1f});
            metaTable.setWidthPercentage(100);
            metaTable.setSpacingAfter(12);
            addMetaCell(metaTable, "Дата приема", formatDate(appointment.getAppointmentDate()), labelFont, valueFont);
            addMetaCell(metaTable, "Время", formatTime(appointment.getAppointmentTime()), labelFont, valueFont);
            addMetaCell(metaTable, "Врач", safe(doctor.getFullName()), labelFont, valueFont);
            addMetaCell(metaTable, "Специальность", safe(doctor.getSpecialty()), labelFont, valueFont);
            addMetaCell(metaTable, "Услуга", safe(appointment.getServiceName()), labelFont, valueFont);
            addMetaCell(metaTable, "Номер приема", "#" + appointment.getId(), labelFont, valueFont);
            document.add(metaTable);

            document.add(section("Данные пациента", sectionFont));
            PdfPTable patientTable = new PdfPTable(new float[]{1f, 1f});
            patientTable.setWidthPercentage(100);
            patientTable.setSpacingAfter(10);
            addMetaCell(patientTable, "ФИО", safe(patient.fullName()), labelFont, valueFont);
            addMetaCell(patientTable, "Дата рождения", formatDate(patient.birthDate()), labelFont, valueFont);
            addMetaCell(patientTable, "Возраст", formatAge(patient.birthDate()), labelFont, valueFont);
            addMetaCell(patientTable, "Пол", safe(patient.gender()), labelFont, valueFont);
            addMetaCell(patientTable, "Телефон", safe(patient.phone()), labelFont, valueFont);
            addMetaCell(patientTable, "Email", safe(patient.email()), labelFont, valueFont);
            addMetaCell(patientTable, "Адрес", safe(patient.address()), labelFont, valueFont);
            addMetaCell(patientTable, "Рост / вес", formatHeightWeight(patient.heightCm(), patient.weightKg()), labelFont, valueFont);
            addMetaCell(patientTable, "Группа крови", safe(patient.bloodGroup()), labelFont, valueFont);
            addMetaCell(patientTable, "Резус-фактор", safe(patient.rhFactor()), labelFont, valueFont);
            addMetaCell(patientTable, "Аллергии", safe(patient.allergies()), labelFont, valueFont);
            addMetaCell(patientTable, "Хронические состояния", safe(patient.chronicConditions()), labelFont, valueFont);
            document.add(patientTable);

            document.add(section("Жалобы", sectionFont));
            document.add(paragraph(safe(appointment.getComplaints()), valueFont, 0, 0, 0, 8));

            document.add(section("Анамнез", sectionFont));
            document.add(paragraph(safe(appointment.getAnamnesis()), valueFont, 0, 0, 0, 8));

            document.add(section("Объективные данные", sectionFont));
            document.add(paragraph(safe(appointment.getObjectiveFindings()), valueFont, 0, 0, 0, 8));

            document.add(section("Диагноз", sectionFont));
            document.add(paragraph(safe(appointment.getDiagnosis()), valueFont, 0, 0, 0, 8));

            document.add(section("Назначения", sectionFont));
            document.add(paragraph(safe(appointment.getPrescriptions()), valueFont, 0, 0, 0, 8));

            document.add(section("План лечения и наблюдения", sectionFont));
            document.add(paragraph(safe(appointment.getTreatmentPlan()), valueFont, 0, 0, 0, 8));

            document.add(section("Итог приема", sectionFont));
            document.add(paragraph(safe(appointment.getCompletionSummary()), valueFont, 0, 0, 0, 8));

            document.add(section("Комментарий по профилю специальности", sectionFont));
            for (String line : template.summaryBullets()) {
                document.add(paragraph("• " + line, valueFont, 8, 0, 0, 4));
            }

            document.add(paragraph(
                    "Документ сформирован автоматически в информационной системе клиники.",
                    noteFont,
                    0,
                    18,
                    0,
                    4
            ));
            document.add(paragraph(
                    "Подпись врача: ____________________",
                    noteFont,
                    0,
                    10,
                    0,
                    0
            ));

            document.close();
            return outputStream.toByteArray();
        } catch (IOException | DocumentException exception) {
            throw new IllegalStateException("Не удалось сформировать PDF заключения по приему", exception);
        }
    }

    private Paragraph section(String text, Font font) {
        return paragraph(text, font, 0, 12, 0, 6);
    }

    private Paragraph paragraph(String text, Font font, float leftIndent, float spacingBefore, float spacingAfter, float leading) {
        Paragraph paragraph = new Paragraph(text, font);
        paragraph.setIndentationLeft(leftIndent);
        paragraph.setSpacingBefore(spacingBefore);
        paragraph.setSpacingAfter(spacingAfter);
        paragraph.setLeading(font.getSize() + leading);
        return paragraph;
    }

    private void addMetaCell(PdfPTable table, String label, String value, Font labelFont, Font valueFont) {
        PdfPCell cell = new PdfPCell();
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setPadding(0f);
        cell.setPaddingBottom(8f);
        cell.addElement(new Paragraph(label, labelFont));
        cell.addElement(new Paragraph(value, valueFont));
        table.addCell(cell);
    }

    private Font font(float size, boolean bold, Color color) throws IOException, DocumentException {
        String path = bold ? "fonts/Roboto-Medium.ttf" : "fonts/Roboto-Regular.ttf";
        byte[] fontBytes = new ClassPathResource(path).getInputStream().readAllBytes();
        BaseFont baseFont = BaseFont.createFont(path, BaseFont.IDENTITY_H, BaseFont.EMBEDDED, false, fontBytes, null);
        Font font = new Font(baseFont, size, bold ? Font.BOLD : Font.NORMAL, color);
        return font;
    }

    private String safe(String value) {
        if (value == null || value.isBlank()) {
            return "Не указано";
        }
        return value.trim();
    }

    private String formatDate(LocalDate value) {
        return value == null ? "Не указано" : value.format(DATE_FORMATTER);
    }

    private String formatTime(LocalTime value) {
        return value == null ? "Не указано" : value.format(TIME_FORMATTER);
    }

    private String formatAge(LocalDate value) {
        if (value == null) {
            return "Не указано";
        }
        int age = Period.between(value, LocalDate.now()).getYears();
        return age >= 0 ? age + " лет" : "Не указано";
    }

    private String formatHeightWeight(Integer heightCm, BigDecimal weightKg) {
        String height = heightCm == null ? "не указано" : heightCm + " см";
        String weight = weightKg == null ? "не указан" : weightKg.stripTrailingZeros().toPlainString() + " кг";
        return height + " / " + weight;
    }
}
