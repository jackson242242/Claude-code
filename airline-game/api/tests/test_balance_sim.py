"""Smoke test for M5.3 balance_sim.py.

Runs a minimal simulation (--turns 8 --games 1) and verifies:
- Output contains the table header line
- Output contains at least 4 data rows (one per strategy × HQ combo)
"""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "balance_sim.py"


def test_balance_sim_smoke():
    result = subprocess.run(
        [sys.executable, str(SCRIPT), "--turns", "8", "--games", "1"],
        capture_output=True,
        text=True,
        timeout=60,
    )
    assert result.returncode == 0, f"balance_sim exited {result.returncode}:\n{result.stderr}"
    output = result.stdout

    # Header must be present
    assert "strategy" in output and "hq" in output and "win_rate" in output, (
        f"table header missing from output:\n{output}"
    )

    # Count data rows: lines that contain at least one of the strategy names
    strategy_names = ["narrowbody-hub", "widebody-premium", "budget", "idle"]
    data_rows = [
        line for line in output.splitlines()
        if any(s in line for s in strategy_names)
    ]
    assert len(data_rows) >= 4, (
        f"expected at least 4 data rows, got {len(data_rows)}:\n{output}"
    )
