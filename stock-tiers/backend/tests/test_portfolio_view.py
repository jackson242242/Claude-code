"""View builder: value weighting, totals, and the manager-style guardrails."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

from app.schemas import HoldingNote, PortfolioHolding, ResearchReport
from app.services.portfolio_view import build_portfolio_view


def _holding(
    ticker: str,
    *,
    entry: float,
    current: float | None,
    shares: float = 1.0,
    trend: str | None = None,
) -> PortfolioHolding:
    cost = entry * shares
    market = current * shares if current is not None else None
    return PortfolioHolding(
        ticker=ticker,
        name=f"{ticker} Inc",
        entry_price=entry,
        entry_date="2026-06-01",
        shares=shares,
        trend=trend,
        current_price=current,
        cost_basis=cost,
        market_value=market,
        pnl=market - cost if market is not None else None,
    )


def _report(
    *notes: HoldingNote, generated_at: str = datetime.now(UTC).isoformat()
) -> ResearchReport:
    return ResearchReport(
        summary="s",
        notes=list(notes),
        diversification="d",
        generated_at=generated_at,
        disclaimer="not financial advice",
    )


def test_totals_and_value_weights() -> None:
    view = build_portfolio_view(
        [
            _holding("AAA", entry=100, current=150, shares=2, trend="趋势甲"),  # value 300
            _holding("BBB", entry=100, current=100, shares=1, trend="趋势乙"),  # value 100
        ],
        research=None,
    )
    assert view.total_cost == 300
    assert view.total_value == 400
    assert view.total_pnl == 100
    assert view.total_pnl_pct is not None and abs(view.total_pnl_pct - 1 / 3) < 1e-9
    weights = {h.ticker: h.weight_pct for h in view.holdings}
    assert weights["AAA"] == 0.75  # value-weighted, not count-weighted
    assert view.trend_slices[0].trend == "趋势甲"
    assert view.trend_slices[0].weight_pct == 0.75


def test_unpriceable_holding_falls_back_to_cost_and_flags_info() -> None:
    view = build_portfolio_view(
        [
            _holding("AAA", entry=100, current=None, shares=1, trend="趋势甲"),
            _holding("BBB", entry=100, current=100, shares=1, trend="趋势乙"),
        ],
        research=None,
    )
    assert view.total_value == 200  # cost fallback keeps totals meaningful
    assert any("AAA" in a.message for a in view.alerts if a.level == "info")


def test_concentration_alerts() -> None:
    view = build_portfolio_view(
        [
            _holding("AAA", entry=100, current=900, shares=1, trend="趋势甲"),  # 90%
            _holding("BBB", entry=100, current=100, shares=1, trend="趋势乙"),
        ],
        research=_report(),
    )
    messages = [a.message for a in view.alerts if a.level == "warning"]
    assert any("AAA" in m and "集中度" in m for m in messages)  # position > 30%
    assert any("趋势甲" in m for m in messages)  # trend > 60%


def test_single_holding_has_no_concentration_alert() -> None:
    view = build_portfolio_view(
        [_holding("AAA", entry=100, current=100, trend="趋势甲")], research=_report()
    )
    assert not [a for a in view.alerts if a.level == "warning"]


def test_deteriorating_thesis_and_stale_research_flagged() -> None:
    old = (datetime.now(UTC) - timedelta(days=5)).isoformat()
    report = _report(
        HoldingNote(ticker="AAA", headline="h", thesis_status="broken", note="n"),
        HoldingNote(ticker="GONE", headline="h", thesis_status="broken", note="n"),
        generated_at=old,
    )
    view = build_portfolio_view(
        [
            _holding("AAA", entry=100, current=100, trend="趋势甲"),
            _holding("BBB", entry=100, current=100, trend="趋势乙"),
        ],
        research=report,
    )
    warnings = [a.message for a in view.alerts if a.level == "warning"]
    assert any("AAA" in m and "失效" in m for m in warnings)
    assert not any("GONE" in m for m in warnings)  # only held tickers flagged
    assert any("研究报告已是" in a.message for a in view.alerts if a.level == "info")
    # Warnings sort ahead of infos.
    levels = [a.level for a in view.alerts]
    assert levels == sorted(levels, key=lambda level: level != "warning")
