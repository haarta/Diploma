from pathlib import Path

from pygments import highlight
from pygments.formatters import ImageFormatter
from pygments.lexers import get_lexer_by_name


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "docs" / "chapter3-assets" / "code"


def snippet_between(path: Path, start_marker: str, end_marker: str) -> str:
    text = path.read_text(encoding="utf-8")
    start = text.index(start_marker)
    end = text.index(end_marker, start) + len(end_marker)
    return text[start:end].strip()


def render(path: Path, snippet: str, lexer_name: str):
    lexer = get_lexer_by_name(lexer_name)
    formatter = ImageFormatter(
        font_name="Consolas",
        font_size=16,
        line_numbers=True,
        image_pad=24,
        line_pad=3,
        style="friendly",
        line_number_bg="#f3f4f6",
        line_number_fg="#64748b",
    )
    image = highlight(snippet, lexer, formatter)
    path.write_bytes(image)


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    docker_compose = (ROOT / "docker-compose.yml").read_text(encoding="utf-8").strip()
    api_snippet = snippet_between(
        ROOT / "medical-frontend" / "src" / "api.js",
        "const createClient = (baseURL, headers = undefined) =>",
        "attachAuthInterceptors(authApi);",
    )
    appointment_service_snippet = snippet_between(
        ROOT / "services" / "appointment-service" / "src" / "main" / "java" / "com" / "medisystem" / "appointment" / "service" / "AppointmentService.java",
        "@Transactional\n    public Appointment createMine",
        "    private void ensureServiceName(String serviceName) {",
    )
    doctor_workspace_snippet = snippet_between(
        ROOT / "services" / "appointment-service" / "src" / "main" / "java" / "com" / "medisystem" / "appointment" / "service" / "DoctorWorkspaceService.java",
        "@Transactional\n    public DoctorUpcomingAppointmentResponse updateAppointmentStatus(",
        "    private Doctor findDoctorByUserId(long userId) {",
    )

    render(OUT_DIR / "code-docker-compose.png", docker_compose, "yaml")
    render(OUT_DIR / "code-frontend-api.png", api_snippet, "javascript")
    render(OUT_DIR / "code-appointment-service.png", appointment_service_snippet, "java")
    render(OUT_DIR / "code-doctor-workspace.png", doctor_workspace_snippet, "java")


if __name__ == "__main__":
    main()
