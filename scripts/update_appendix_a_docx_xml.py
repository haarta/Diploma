from __future__ import annotations

import shutil
import tempfile
import zipfile
from pathlib import Path
import sys
import xml.etree.ElementTree as ET


W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
XML_NS = "http://www.w3.org/XML/1998/namespace"
W = f"{{{W_NS}}}"


ET.register_namespace("w", W_NS)
ET.register_namespace("xml", XML_NS)


def w_tag(name: str) -> str:
    return f"{W}{name}"


def create_text_run(text: str, font_name: str, font_size_half_points: int) -> ET.Element:
    run = ET.Element(w_tag("r"))
    run_props = ET.SubElement(run, w_tag("rPr"))
    fonts = ET.SubElement(run_props, w_tag("rFonts"))
    fonts.set(w_tag("ascii"), font_name)
    fonts.set(w_tag("hAnsi"), font_name)
    fonts.set(w_tag("cs"), font_name)
    size = ET.SubElement(run_props, w_tag("sz"))
    size.set(w_tag("val"), str(font_size_half_points))
    size_cs = ET.SubElement(run_props, w_tag("szCs"))
    size_cs.set(w_tag("val"), str(font_size_half_points))
    text_node = ET.SubElement(run, w_tag("t"))
    if text.startswith(" ") or text.endswith(" "):
        text_node.set(f"{{{XML_NS}}}space", "preserve")
    text_node.text = text
    return run


def create_regular_paragraph(
    text: str,
    *,
    font_name: str = "Times New Roman",
    font_size_half_points: int = 24,
    center: bool = False,
) -> ET.Element:
    paragraph = ET.Element(w_tag("p"))
    paragraph_props = ET.SubElement(paragraph, w_tag("pPr"))
    spacing = ET.SubElement(paragraph_props, w_tag("spacing"))
    spacing.set(w_tag("before"), "0")
    spacing.set(w_tag("after"), "0")
    if center:
        justification = ET.SubElement(paragraph_props, w_tag("jc"))
        justification.set(w_tag("val"), "center")
    paragraph.append(create_text_run(text, font_name, font_size_half_points))
    return paragraph


def create_break_run(page_break: bool = False) -> ET.Element:
    run = ET.Element(w_tag("r"))
    br = ET.SubElement(run, w_tag("br"))
    if page_break:
        br.set(w_tag("type"), "page")
    return run


def create_code_paragraph(code: str) -> ET.Element:
    paragraph = ET.Element(w_tag("p"))
    paragraph_props = ET.SubElement(paragraph, w_tag("pPr"))
    spacing = ET.SubElement(paragraph_props, w_tag("spacing"))
    spacing.set(w_tag("before"), "0")
    spacing.set(w_tag("after"), "0")

    lines = code.splitlines()
    for index, line in enumerate(lines):
        paragraph.append(create_text_run(line, "Consolas", 18))
        if index != len(lines) - 1:
            paragraph.append(create_break_run())
    return paragraph


def create_blank_paragraph() -> ET.Element:
    return ET.Element(w_tag("p"))


def create_page_break_paragraph() -> ET.Element:
    paragraph = ET.Element(w_tag("p"))
    paragraph.append(create_break_run(page_break=True))
    return paragraph


def extract_paragraph_text(paragraph: ET.Element) -> str:
    return "".join(text_node.text or "" for text_node in paragraph.findall(f".//{w_tag('t')}")).strip()


def update_appendix_a(document_path: Path) -> Path:
    backup_path = document_path.with_name(f"{document_path.stem}_backup_before_appendix_a_text{document_path.suffix}")
    shutil.copy2(document_path, backup_path)

    workdir = Path(tempfile.mkdtemp(prefix="appendix_a_docx_"))
    with zipfile.ZipFile(document_path, "r") as source_zip:
        source_zip.extractall(workdir)

    document_xml = workdir / "word" / "document.xml"
    tree = ET.parse(document_xml)
    root = tree.getroot()
    body = root.find(w_tag("body"))
    if body is None:
        raise RuntimeError("word/document.xml does not contain w:body")

    paragraphs = [node for node in list(body) if node.tag == w_tag("p")]
    paragraph_texts = [extract_paragraph_text(paragraph) for paragraph in paragraphs]

    try:
        appendix_a_index = paragraph_texts.index("Приложение А")
        appendix_a_title_index = paragraph_texts.index("Фрагменты программной реализации")
        appendix_b_index = paragraph_texts.index("Приложение Б")
    except ValueError as exc:
        raise RuntimeError("Could not locate Appendix A or Appendix B in the document") from exc

    appendix_b_node = paragraphs[appendix_b_index]
    nodes_to_remove = paragraphs[appendix_a_title_index + 1:appendix_b_index]

    for node in nodes_to_remove:
        body.remove(node)

    captions = [
        "Рисунок А.1 - Фрагмент конфигурации подключения appointment-service к базе данных PostgreSQL",
        "Рисунок А.2 - Фрагмент клиентского модуля api.js с подстановкой JWT-токена в запросы",
        "Рисунок А.3 - Фрагмент AppointmentService с проверкой занятости временного слота",
        "Рисунок А.4 - Фрагмент DoctorWorkspaceService с обновлением статуса приема",
    ]

    fragments = [
        """appointment-service:
  environment:
    DB_HOST: appointment-db
    DB_PORT: 5432
    DB_NAME: appointment_db
    DB_USER: appointment_user
    DB_PASSWORD: ${APPOINTMENT_DB_PASSWORD:-appointment_password}

appointment-db:
  environment:
    POSTGRES_DB: appointment_db
    POSTGRES_USER: appointment_user""",
        """const withAccessToken = (config = {}) => {
  const token = getAccessToken();
  if (!token) {
    return config;
  }

  return {
    ...config,
    headers: {
      ...(config.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  };
};""",
        """boolean occupied = repo.existsByDoctorIdAndAppointmentDateAndAppointmentTimeAndStatusNot(
        doctorId,
        date,
        time,
        AppointmentStatus.CANCELLED
);
if (occupied) {
    throw new IllegalArgumentException(...);
}""",
        """AppointmentStatus nextStatus = parseDoctorStatus(request.status());
appointment.setStatus(nextStatus);
if (nextStatus == AppointmentStatus.COMPLETED) {
    appointment.setCompletedAt(OffsetDateTime.now());
    appointment.setCompletionSummary(normalizeNullableText(request.completionSummary()));
}
Appointment saved = appointmentRepository.save(appointment);""",
    ]

    insert_nodes: list[ET.Element] = []
    for caption, fragment in zip(captions, fragments):
        insert_nodes.append(create_regular_paragraph(caption, center=True))
        insert_nodes.append(create_code_paragraph(fragment))
        insert_nodes.append(create_blank_paragraph())

    if nodes_to_remove and extract_paragraph_text(nodes_to_remove[-1]) != "":
        insert_nodes.append(create_blank_paragraph())
    insert_nodes.append(create_page_break_paragraph())

    insertion_index = list(body).index(appendix_b_node)
    for offset, node in enumerate(insert_nodes):
        body.insert(insertion_index + offset, node)

    tree.write(document_xml, encoding="UTF-8", xml_declaration=True)

    with zipfile.ZipFile(document_path, "w", compression=zipfile.ZIP_DEFLATED) as target_zip:
        for file_path in sorted(workdir.rglob("*")):
            if file_path.is_file():
                target_zip.write(file_path, file_path.relative_to(workdir).as_posix())

    shutil.rmtree(workdir, ignore_errors=True)
    return backup_path


if __name__ == "__main__":
    desktop_doc = Path(sys.argv[1]) if len(sys.argv) > 1 else Path.home() / "Desktop" / "VKR_Smyshlyaev_3_appendixA_text.docx"
    backup = update_appendix_a(desktop_doc)
    print(f"UPDATED: {desktop_doc}")
    print(f"BACKUP: {backup}")
