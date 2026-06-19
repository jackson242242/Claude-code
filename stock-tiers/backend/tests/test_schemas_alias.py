"""camelCase alias round-tripping for the wire contract."""

from __future__ import annotations

from app.schemas import HotStock, TierEntry


def test_hotstock_serializes_camel() -> None:
    hs = HotStock(
        ticker="NVDA", name="NVIDIA", price=1.0, one_year_change_pct=0.74, sector="Semis"
    )
    dumped = hs.model_dump(by_alias=True)
    assert "oneYearChangePct" in dumped
    assert "one_year_change_pct" not in dumped


def test_hotstock_parses_camel_input() -> None:
    hs = HotStock.model_validate(
        {
            "ticker": "AMD",
            "name": "AMD",
            "price": 2.0,
            "oneYearChangePct": 0.58,
            "sector": "Semis",
        }
    )
    assert hs.one_year_change_pct == 0.58


def test_hotstock_accepts_snake_by_name() -> None:
    hs = HotStock(
        ticker="AVGO", name="Broadcom", price=3.0, one_year_change_pct=0.69, sector="Semis"
    )
    assert hs.one_year_change_pct == 0.69


def test_tierentry_camel_fields() -> None:
    te = TierEntry(
        ticker="VRT",
        name="Vertiv",
        price=10.0,
        one_year_change_pct=0.88,
        tier="S",
        relationship="downstream",
        rationale="r",
        tier_justification="j",
    )
    dumped = te.model_dump(by_alias=True)
    assert dumped["tierJustification"] == "j"
    assert dumped["relationship"] == "downstream"
