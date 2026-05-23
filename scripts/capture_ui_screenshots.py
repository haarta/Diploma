import base64
import json
import os
import socket
import subprocess
import tempfile
import time
import urllib.request
from pathlib import Path

import websocket


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "docs" / "chapter3-assets" / "ui"
BASE_URL = "http://localhost:5173"
HTTP_OPENER = urllib.request.build_opener(urllib.request.ProxyHandler({}))

ADMIN_EMAIL = "admin@medisystem.local"
ADMIN_PASSWORD = "admin12345"
PATIENT_EMAIL = "demo.patient.20260523@example.com"
DOCTOR_EMAIL = "demo.doctor.20260523@example.com"
DEMO_PASSWORD = "Demo12345!"

TOKEN_KEYS = {
    "access": "auth_access_token",
    "refresh": "auth_refresh_token",
}


def find_chrome() -> str:
    candidates = [
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    ]
    for candidate in candidates:
        if os.path.exists(candidate):
            return candidate
    raise FileNotFoundError("Chrome/Edge executable was not found")


def free_port() -> int:
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        return sock.getsockname()[1]


def http_get_json(url: str):
    with HTTP_OPENER.open(url, timeout=10) as response:
        return json.loads(response.read().decode("utf-8"))


def login(email: str, password: str) -> dict:
    with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False, encoding="utf-8") as handle:
        json.dump({"email": email, "password": password}, handle, ensure_ascii=False)
        payload_file = handle.name

    try:
        result = subprocess.run(
            [
                "curl.exe",
                "-s",
                "--http1.1",
                "-X",
                "POST",
                "http://localhost:8081/api/auth/login",
                "-H",
                "Content-Type: application/json",
                "--data-binary",
                f"@{payload_file}",
            ],
            check=True,
            capture_output=True,
            text=True,
        )
    finally:
        os.unlink(payload_file)

    body = result.stdout.strip()
    if not body:
        raise RuntimeError(f"Empty login response for {email}")
    return json.loads(body)


class CDPSession:
    def __init__(self, ws_url: str):
        self.ws = websocket.create_connection(ws_url, timeout=30)
        self.next_id = 1

    def send(self, method: str, params: dict | None = None):
        message_id = self.next_id
        self.next_id += 1
        payload = {"id": message_id, "method": method}
        if params:
            payload["params"] = params
        self.ws.send(json.dumps(payload))
        while True:
            raw = self.ws.recv()
            message = json.loads(raw)
            if message.get("id") == message_id:
                if "error" in message:
                    raise RuntimeError(f"CDP error for {method}: {message['error']}")
                return message.get("result", {})

    def close(self):
        try:
            self.ws.close()
        except Exception:
            pass


def wait_for_debugger(port: int, timeout: float = 20.0) -> dict:
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            return http_get_json(f"http://127.0.0.1:{port}/json/version")
        except Exception:
            time.sleep(0.25)
    raise TimeoutError("Chrome DevTools endpoint did not start in time")


def wait_for_target(port: int, timeout: float = 20.0) -> str:
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            targets = http_get_json(f"http://127.0.0.1:{port}/json/list")
        except Exception:
            time.sleep(0.25)
            continue
        for target in targets:
            if target.get("type") == "page" and target.get("webSocketDebuggerUrl"):
                return target["webSocketDebuggerUrl"]
        time.sleep(0.25)
    raise TimeoutError("No page target was exposed by Chrome")


def wait_for_text(session: CDPSession, text: str, timeout: float = 20.0):
    deadline = time.time() + timeout
    needle = json.dumps(text, ensure_ascii=False)
    while time.time() < deadline:
        result = evaluate(
            session,
            f"(document.body ? document.body.innerText || '' : '').includes({needle})",
        )
        if result.get("result", {}).get("value"):
            return
        time.sleep(0.25)
    raise TimeoutError(f'Text "{text}" did not appear on the page')


def evaluate(session: CDPSession, expression: str, await_promise: bool = False):
    return session.send(
        "Runtime.evaluate",
        {"expression": expression, "awaitPromise": await_promise, "returnByValue": True},
    )


def navigate(session: CDPSession, url: str, wait_text: str | None = None):
    session.send("Page.navigate", {"url": url})
    time.sleep(2.5)
    if wait_text:
        wait_for_text(session, wait_text, timeout=20.0)
    else:
        time.sleep(1.5)


def set_viewport(session: CDPSession, width: int, height: int):
    session.send(
        "Emulation.setDeviceMetricsOverride",
        {
            "width": width,
            "height": height,
            "deviceScaleFactor": 1,
            "mobile": False,
        },
    )


def set_tokens(session: CDPSession, access_token: str | None, refresh_token: str | None):
    parts = []
    if access_token:
        parts.append(f"localStorage.setItem('{TOKEN_KEYS['access']}', '{access_token}')")
    else:
        parts.append(f"localStorage.removeItem('{TOKEN_KEYS['access']}')")
    if refresh_token:
        parts.append(f"localStorage.setItem('{TOKEN_KEYS['refresh']}', '{refresh_token}')")
    else:
        parts.append(f"localStorage.removeItem('{TOKEN_KEYS['refresh']}')")
    parts.append("window.dispatchEvent(new Event('auth-change'))")
    evaluate(session, ";".join(parts))


def capture(session: CDPSession, path: Path, width: int, base_height: int):
    metrics = session.send("Page.getLayoutMetrics")
    content_height = int(metrics["contentSize"]["height"])
    height = max(base_height, min(content_height + 80, 2600))
    set_viewport(session, width, height)
    screenshot = session.send(
        "Page.captureScreenshot",
        {"format": "png", "fromSurface": True, "captureBeyondViewport": True},
    )
    path.write_bytes(base64.b64decode(screenshot["data"]))


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    admin_tokens = login(ADMIN_EMAIL, ADMIN_PASSWORD)
    patient_tokens = login(PATIENT_EMAIL, DEMO_PASSWORD)
    port = free_port()
    user_data_dir = tempfile.mkdtemp(prefix="chapter3-browser-")
    chrome = subprocess.Popen(
        [
            find_chrome(),
            "--headless",
            "--disable-gpu",
            "--hide-scrollbars",
            "--no-first-run",
            "--no-default-browser-check",
            "--remote-allow-origins=*",
            "--remote-debugging-address=127.0.0.1",
            f"--remote-debugging-port={port}",
            f"--user-data-dir={user_data_dir}",
            "about:blank",
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    session = None
    try:
        wait_for_debugger(port)
        ws_url = wait_for_target(port)
        session = CDPSession(ws_url)
        session.send("Page.enable")
        session.send("Runtime.enable")
        set_viewport(session, 1440, 1600)

        shots = [
            {
                "name": "ui-public-doctors.png",
                "route": f"{BASE_URL}/doctors",
                "wait_text": "Демонстрационный Врач",
                "tokens": None,
                "width": 1440,
                "height": 1500,
            },
            {
                "name": "ui-appointments-booking.png",
                "route": f"{BASE_URL}/appointments?doctorId=9",
                "wait_text": "Демонстрационный Врач",
                "tokens": patient_tokens,
                "width": 1500,
                "height": 1900,
            },
            {
                "name": "ui-doctor-verification-request.png",
                "route": f"{BASE_URL}/cabinet/doctor-verification",
                "wait_text": "Заявка на роль врача",
                "tokens": patient_tokens,
                "width": 1440,
                "height": 1800,
            },
            {
                "name": "ui-admin-doctors.png",
                "route": f"{BASE_URL}/admin/doctors",
                "wait_text": "Создание врача",
                "tokens": admin_tokens,
                "width": 1500,
                "height": 1700,
            },
        ]

        for shot in shots:
            navigate(session, BASE_URL)
            if shot["tokens"]:
                set_tokens(
                    session,
                    shot["tokens"]["accessToken"],
                    shot["tokens"]["refreshToken"],
                )
            else:
                set_tokens(session, None, None)
            navigate(session, shot["route"], shot["wait_text"])
            capture(session, OUT_DIR / shot["name"], shot["width"], shot["height"])

    finally:
        if session:
            session.close()
        chrome.terminate()
        try:
            chrome.wait(timeout=5)
        except Exception:
            chrome.kill()


if __name__ == "__main__":
    main()
