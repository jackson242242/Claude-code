import type { Dict } from './zh';

const en: Dict = {
  // ── StartScreen ──────────────────────────────────────────────────
  'start.tagline': 'SkyEmpire · 2026 Q3',
  'start.title': 'Sky Empire',
  'start.subtitle': 'Build your airline, choose a hub, and run a turn-based carrier. Starting capital: $420M.',
  'start.label.airlineName': 'Airline Name',
  'start.placeholder.airlineName': 'e.g. Global Wings Airlines',
  'start.heading.hq': 'Choose Hub (HQ)',
  'start.placeholder.search': 'Search cities, countries…',
  'start.aria.search': 'Search cities',
  'start.empty.cities': 'No matching cities found',
  'start.btn.creating': 'Creating…',
  'start.btn.create': 'Found Airline ✈',

  // ── TopBar ────────────────────────────────────────────────────────
  'topbar.turn': 'Turn {turn}/80',
  'topbar.cash': 'Cash',
  'topbar.aria.audioOn': 'Mute music',
  'topbar.aria.audioOff': 'Play music',
  'topbar.aria.voiceOn': 'Mute voice',
  'topbar.aria.voiceOff': 'Enable voice',
  'topbar.btn.settling': 'Settling…',
  'topbar.btn.nextTurn': 'Next Quarter ▸',

  // ── GameScreen ────────────────────────────────────────────────────
  'game.aria.tabPanel': 'Control Panel',
  'game.aria.dismissError': 'Dismiss',
  'game.tab.routes': 'Routes',
  'game.tab.fleet': 'Fleet',
  'game.tab.market': 'Aircraft Market',
  'game.tab.finance': 'Finance',
  'game.tab.news': 'News',

  // ── TurnReportModal ───────────────────────────────────────────────
  'report.aria': 'Quarterly Report',
  'report.heading': 'Quarterly Report',
  'report.revenue': 'Revenue',
  'report.cost': 'Cost',
  'report.profit': 'Net Profit',
  'report.section.routes': 'Route Performance',
  'report.section.news': 'News Roundup',
  'report.btn.continue': 'Continue ▸',
  'report.class.cabin': 'Cabin',
  'report.class.pax': 'Pax',
  'report.class.capacity': 'Capacity',
  'report.class.revenue': 'Revenue',

  // ── FinalScreen ───────────────────────────────────────────────────
  'final.aria': 'Game Over — Final Results',
  'final.victory.headline': 'Sky Domination',
  'final.victory.subtitle': '{airlineName} takes the #1 spot',
  'final.defeat.headline': 'Journey Ends',
  'final.defeat.subtitle': '{airlineName} — Final Rank: #{rank}',
  'final.standings.heading': 'Final Standings',
  'final.stat.profit': 'Cumulative Profit',
  'final.stat.pax': 'Total Passengers',
  'final.footer': '20 years / {endedTurn} turns',
  'final.btn.restart': 'Play Again',
  'final.pax.M': '{val}M pax',
  'final.pax.K': '{val}K pax',
  'final.pax.unit': '{val} pax',

  // ── GameOverScreen ────────────────────────────────────────────────
  'gameover.aria': 'Game Over',
  'gameover.heading': 'Bankruptcy',
  'gameover.body': '{airlineName} had negative cash for two consecutive quarters and has entered bankruptcy. The airline empire journey ends here.',
  'gameover.btn.restart': 'Start Over',

  // ── EventTicker ───────────────────────────────────────────────────
  'ticker.aria.region': 'Active Events',
  'ticker.label': 'Events',
  'ticker.severity.major': 'Major',
  'ticker.severity.minor': 'Minor',
  'ticker.effect.demand': 'Demand',
  'ticker.effect.fuelCost': 'Fuel',
  'ticker.effect.slotFee': 'Airport Fee',
  'ticker.effect.serviceCost': 'Service Cost',
  'ticker.scope.global': 'Global',
  'ticker.effects.suffix': 'affects {scope}',
  'ticker.remaining': '⏳ {n} qtrs left',
  'ticker.sourceLink': 'Source',
  'ticker.aria.close': 'Close',

  // ── SlotBadge ─────────────────────────────────────────────────────
  'slot.held': 'Held {n}',
  'slot.used': 'Used {n}',
  'slot.pool': 'Pool {taken}/{capacity}',

  // ── CityCard ──────────────────────────────────────────────────────
  'city.aria.demand': 'Demand index {value}/10',
  'city.chip.slots': 'Slots {n}',
  'city.chip.fee': '${n}K/op',

  // ── AircraftCard ──────────────────────────────────────────────────
  'aircraft.spec.seats': 'Seats',
  'aircraft.spec.range': 'Range',
  'aircraft.spec.price': 'Price',
  'aircraft.btn.buy': 'Buy',
  'aircraft.btn.lease': 'Lease',

  // ── RoutesTab ─────────────────────────────────────────────────────
  'routes.open.heading': 'Open New Route · Hub {hqCity}',
  'routes.dest.placeholder': 'Choose destination (or tap map city)…',
  'routes.dest.option': '{nameZh} {name} · Demand {demand}/10',
  'routes.btn.open': 'Open',
  'routes.hq.tag': ' (HQ)',
  'routes.slot.gate': 'Both ends need 1 free held slot before opening — negotiate first.',
  'routes.slot.full': 'Pool Full',
  'routes.slot.negotiate': 'Negotiate slot · {cost}',
  'routes.empty': 'No routes yet. Open a route from your hub and assign aircraft.',
  'routes.assigned.heading': 'Assigned Aircraft ({n})',
  'routes.assigned.none': 'No aircraft assigned — this route has no capacity.',
  'routes.aircraft.owned': 'Owned',
  'routes.aircraft.leased': 'Leased',
  'routes.aircraft.onOtherRoute': ' (on another route)',
  'routes.assign.placeholder': 'Choose available aircraft…',
  'routes.assign.aria': 'Select aircraft to assign',
  'routes.assign.btn': 'Assign',
  'routes.unassign.aria': 'Unassign {aircraftId}',
  'routes.flights.heading': 'Weekly Flights (one-way)',
  'routes.flights.decrement': 'Decrease flights',
  'routes.flights.increment': 'Increase flights',
  'routes.fare.heading': 'Fare Multiplier',
  'routes.fare.low': '0.6 Budget',
  'routes.fare.high': '1.6 Premium',
  'routes.fare.aria': 'Fare multiplier',
  'routes.cabin.aria': 'Cabin Configuration',
  'routes.cabin.heading': 'Cabin Configuration',
  'routes.cabin.error': 'Cabin percentages must sum to 100 (current: {sum})',
  'routes.service.heading': 'Service Tier',
  'routes.service.aria': 'Service tier',
  'routes.cabin.confirm': 'Confirm Cabin Config',
  'routes.lastQ.heading': 'Last Quarter',
  'routes.lastQ.loadFactor': 'Load Factor',
  'routes.lastQ.pax': 'Pax',
  'routes.lastQ.profit': 'Profit',
  'routes.lastQ.empty': 'New route — data will appear after settling.',
  'routes.btn.close': 'Close Route',
  'routes.subtitle': '{dist} · {aircraft} aircraft · {flights} flights/wk · ×{fare}',
  'routes.dest.aria': 'Choose destination city',

  // ── FleetTab ──────────────────────────────────────────────────────
  'fleet.empty': 'Fleet is empty. Go to Aircraft Market to buy or lease your first plane.',
  'fleet.owned': 'Owned',
  'fleet.leased': 'Leased',
  'fleet.idle': 'Idle (holding costs still apply)',
  'fleet.flying': 'Flying {cityA} ⇌ {cityB}',
  'fleet.btn.unassign': 'Unassign',
  'fleet.btn.sell': 'Sell{amount}',
  'fleet.sell.title': 'Residual value {amount}',
  'fleet.btn.return': 'Return Lease',

  // ── FinanceTab ────────────────────────────────────────────────────
  'finance.lastQ.heading': 'Last Quarter P&L',
  'finance.lastQ.revenue': 'Revenue',
  'finance.lastQ.cost': 'Cost',
  'finance.lastQ.profit': 'Net Profit',
  'finance.lastQ.empty': 'First quarter not yet settled.',
  'finance.share.heading': 'Market Share',
  'finance.share.empty': 'Available after settling one quarter.',
  'finance.share.background': 'Background Market / Others',
  'finance.cash.heading': 'Cash Trend',
  'finance.history.heading': 'Quarterly Profit',
  'finance.history.turn': 'Turn {turn}',

  // ── NewsTab ───────────────────────────────────────────────────────
  'news.heading': 'This Quarter',
  'news.empty': 'No news this quarter.',
  'news.kind.event': 'Event',
  'news.kind.system': 'System',
  'news.credits.heading': 'Image Credits',
  'news.credits.empty': 'Aircraft image manifest not generated; missing images use silhouette placeholders.',
  'news.credits.filePage': 'File page',

  // ── Cabin (lib labels) ────────────────────────────────────────────
  'cabin.economy': 'Economy',
  'cabin.business': 'Business',
  'cabin.first': 'First',
  'cabin.service.economy': 'Economy',
  'cabin.service.standard': 'Standard',
  'cabin.service.premium': 'Premium',

  // ── Voice lines ───────────────────────────────────────────────────
  'voice.profit': '{name} says: Great quarter — ${M}B profit, {K}K passengers!',
  'voice.loss': '{name} says: Loss alert! ${M}B loss this quarter, {K}K passengers.',
  'voice.breakeven': '{name} says: Break-even quarter, {K}K passengers.',
  'voice.event': '{name} says: Watch this event: {headline}',

  // ── Advisor display names ─────────────────────────────────────────
  'advisor.0.name': 'Chairman Jin Mantang',
  'advisor.1.name': 'Director Fei Tianmei',
  'advisor.2.name': 'Advisor Yun Danfeng',

  // ── Sparkline ─────────────────────────────────────────────────────────
  'sparkline.empty': 'No history yet',
  'sparkline.aria': 'Cash history chart',
};

export default en;
