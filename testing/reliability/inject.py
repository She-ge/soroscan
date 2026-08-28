"""Failure injection against Docker Compose or named containers.

Used by live failover and compose-backed chaos experiments. Injection always
runs in a try/finally so dependencies are restored even when probes fail.
"""

from __future__ import annotations

import os
import subprocess
from dataclasses import dataclass
from typing import Any


class InjectionError(RuntimeError):
    """Raised when a failure cannot be injected or restored."""


def _run(command: list[str], *, check: bool = True) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        command,
        check=check,
        capture_output=True,
        text=True,
    )


def find_container(image_substring: str) -> str | None:
    result = _run(["docker", "ps", "--format", "{{.ID}}\t{{.Image}}\t{{.Names}}"], check=False)
    if result.returncode != 0:
        return None
    needle = image_substring.lower()
    for line in result.stdout.splitlines():
        parts = line.split("\t")
        if len(parts) < 2:
            continue
        container_id, image = parts[0], parts[1]
        name = parts[2] if len(parts) > 2 else ""
        if needle in image.lower() or needle in name.lower():
            return container_id
    return None


@dataclass
class FailureInjector:
    """Inject and restore a single dependency failure."""

    kind: str
    target: str
    compose_file: str | None = None

    @classmethod
    def from_mapping(cls, raw: dict[str, Any] | None) -> FailureInjector | None:
        if not raw:
            return None
        kind = str(raw.get("kind") or raw.get("type") or "").strip()
        target = str(raw.get("target") or raw.get("service") or raw.get("filter") or "").strip()
        if not kind or not target:
            return None
        compose_file = raw.get("compose_file") or os.getenv("COMPOSE_FILE")
        injector = cls(kind=kind, target=target, compose_file=compose_file)
        injector._paused_id = None
        return injector

    def __post_init__(self) -> None:
        self._paused_id: str | None = None

    def inject(self) -> None:
        if self.kind == "compose":
            self._compose(["stop", self.target])
            return
        if self.kind == "docker":
            container = find_container(self.target)
            if not container:
                raise InjectionError(f"No running container matching {self.target!r}")
            _run(["docker", "pause", container])
            self._paused_id = container
            return
        raise InjectionError(f"Unsupported injector kind {self.kind!r}")

    def restore(self) -> None:
        if self.kind == "compose":
            self._compose(["start", self.target])
            return
        if self.kind == "docker":
            container = getattr(self, "_paused_id", None) or find_container(self.target)
            if not container:
                raise InjectionError(f"No container matching {self.target!r} to restore")
            _run(["docker", "unpause", container], check=False)
            return
        raise InjectionError(f"Unsupported injector kind {self.kind!r}")

    def _compose(self, args: list[str]) -> None:
        command = ["docker", "compose"]
        if self.compose_file:
            command.extend(["-f", self.compose_file])
        command.extend(args)
        result = _run(command, check=False)
        if result.returncode != 0:
            raise InjectionError(
                f"docker compose {' '.join(args)} failed: {result.stderr.strip() or result.stdout.strip()}"
            )
