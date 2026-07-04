"""Portfolio view assembly: value weighting, totals, and manager-style alerts.

The alerts are deterministic guardrails computed from the numbers (not the
LLM): single-position concentration, single-trend concentration, unpriceable
holdings, thesis deterioration flagged by the latest research, stale research.
Monitoring only — never advice.
"""

from __future__ import annotations

from datetime import UTC, datetime

from app.schemas import (
    DISCLAIMER,
    PortfolioAlert,
    PortfolioHolding,
    PortfolioView,
    ResearchReport,
    TrendSlice,
)

UNTAGGED = "未分类"
# Guardrail thresholds (fractions of total portfolio value / hours).
POSITION_WEIGHT_WARN = 0.30
TREND_WEIGHT_WARN = 0.60
RESEARCH_STALE_HOURS = 48


def holding_value(h: PortfolioHolding) -> float:
    """Live market value when priceable, else cost basis (documented fallback)."""
    return h.market_value if h.market_value is not None else h.cost_basis


def apply_weights(holdings: list[PortfolioHolding]) -> float:
    """Fill in each holding's weight_pct; returns the total portfolio value."""
    total = sum(holding_value(h) for h in holdings)
    for h in holdings:
        h.weight_pct = holding_value(h) / total if total > 0 else None
    return total


def _build_alerts(
    holdings: list[PortfolioHolding],
    slices: list[TrendSlice],
    research: ResearchReport | None,
) -> list[PortfolioAlert]:
    alerts: list[PortfolioAlert] = []

    for h in holdings:
        if h.weight_pct is not None and h.weight_pct > POSITION_WEIGHT_WARN and len(holdings) > 1:
            alerts.append(
                PortfolioAlert(
                    level="warning",
                    message=(
                        f"{h.ticker} 占组合 {h.weight_pct:.0%},单一持仓集中度偏高"
                        f"(阈值 {POSITION_WEIGHT_WARN:.0%})"
                    ),
                )
            )

    for s in slices:
        if s.weight_pct > TREND_WEIGHT_WARN and len(slices) > 1:
            alerts.append(
                PortfolioAlert(
                    level="warning",
                    message=(
                        f"「{s.trend}」方向占组合 {s.weight_pct:.0%}——方向过于集中,"
                        "可用「趋势方向」发现其他 secular trend 分散"
                    ),
                )
            )
    if len(slices) == 1 and len(holdings) > 1:
        alerts.append(
            PortfolioAlert(
                level="warning",
                message="整个组合押在单一方向上——建议用「趋势方向」寻找不同驱动力的趋势",
            )
        )

    unpriced = [h.ticker for h in holdings if h.current_price is None]
    if unpriced:
        alerts.append(
            PortfolioAlert(
                level="info",
                message=f"{'、'.join(unpriced)} 暂时拉不到实时价,市值按买入成本估算",
            )
        )

    if research is None:
        if holdings:
            alerts.append(
                PortfolioAlert(
                    level="info",
                    message="还没有研究报告——运行「每日研究」检查各持仓逻辑是否成立",
                )
            )
    else:
        held = {h.ticker for h in holdings}
        for note in research.notes:
            if note.ticker in held and note.thesis_status in ("weakening", "broken"):
                label = "减弱" if note.thesis_status == "weakening" else "失效"
                alerts.append(
                    PortfolioAlert(
                        level="warning",
                        message=f"最近研究判定 {note.ticker} 的投资逻辑「{label}」——建议重点复查",
                    )
                )
        try:
            generated = datetime.fromisoformat(research.generated_at)
            age_hours = (datetime.now(UTC) - generated).total_seconds() / 3600
            if age_hours > RESEARCH_STALE_HOURS:
                alerts.append(
                    PortfolioAlert(
                        level="info",
                        message=f"研究报告已是 {age_hours / 24:.0f} 天前的——建议更新",
                    )
                )
        except ValueError:
            pass  # unparseable timestamp -> skip staleness check

    # Warnings first, stable within each level.
    return sorted(alerts, key=lambda a: a.level != "warning")


def build_portfolio_view(
    holdings: list[PortfolioHolding], research: ResearchReport | None
) -> PortfolioView:
    total_value = apply_weights(holdings)
    total_cost = sum(h.cost_basis for h in holdings)
    total_pnl = total_value - total_cost

    by_trend: dict[str, list[PortfolioHolding]] = {}
    for h in holdings:
        by_trend.setdefault(h.trend or UNTAGGED, []).append(h)
    slices = [
        TrendSlice(
            trend=trend,
            tickers=[h.ticker for h in group],
            weight_pct=sum(holding_value(h) for h in group) / total_value if total_value else 0.0,
        )
        for trend, group in by_trend.items()
    ]
    slices.sort(key=lambda s: -s.weight_pct)

    return PortfolioView(
        holdings=holdings,
        trend_slices=slices,
        total_cost=total_cost,
        total_value=total_value,
        total_pnl=total_pnl,
        total_pnl_pct=total_pnl / total_cost if total_cost > 0 else None,
        alerts=_build_alerts(holdings, slices, research),
        disclaimer=DISCLAIMER,
        generated_at=datetime.now(UTC).isoformat(),
    )
