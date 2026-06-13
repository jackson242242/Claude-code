import type { Dict } from './zh';

// es-419 neutral (Latin American Spanish)
const es: Dict = {
  // ── StartScreen ──────────────────────────────────────────────────
  'start.tagline': 'SkyEmpire · 2026 Q3',
  'start.title': 'Imperio Aéreo',
  'start.subtitle': 'Crea tu aerolínea, elige un hub y administra una empresa por turnos. Capital inicial: $420M.',
  'start.label.airlineName': 'Nombre de la aerolínea',
  'start.placeholder.airlineName': 'Ej.: Alas Globales',
  'start.heading.hq': 'Elegir hub (HQ)',
  'start.placeholder.search': 'Buscar ciudades, países…',
  'start.aria.search': 'Buscar ciudades',
  'start.empty.cities': 'No se encontraron ciudades',
  'start.btn.creating': 'Creando…',
  'start.btn.create': 'Fundar aerolínea ✈',

  // ── TopBar ────────────────────────────────────────────────────────
  'topbar.turn': 'Turno {turn}/80',
  'topbar.cash': 'Efectivo',
  'topbar.aria.audioOn': 'Silenciar música',
  'topbar.aria.audioOff': 'Activar música',
  'topbar.aria.voiceOn': 'Silenciar voz',
  'topbar.aria.voiceOff': 'Activar voz',
  'topbar.btn.settling': 'Calculando…',
  'topbar.btn.nextTurn': 'Próximo trimestre ▸',

  // ── GameScreen ────────────────────────────────────────────────────
  'game.aria.tabPanel': 'Panel de control',
  'game.aria.dismissError': 'Cerrar',
  'game.tab.routes': 'Rutas',
  'game.tab.fleet': 'Flota',
  'game.tab.market': 'Mercado de aviones',
  'game.tab.finance': 'Finanzas',
  'game.tab.news': 'Noticias',

  // ── TurnReportModal ───────────────────────────────────────────────
  'report.aria': 'Informe trimestral',
  'report.heading': 'Informe trimestral',
  'report.revenue': 'Ingresos',
  'report.cost': 'Costos',
  'report.profit': 'Utilidad neta',
  'report.section.routes': 'Desempeño de rutas',
  'report.section.news': 'Novedades',
  'report.btn.continue': 'Continuar ▸',
  'report.class.cabin': 'Cabina',
  'report.class.pax': 'Pax',
  'report.class.capacity': 'Capacidad',
  'report.class.revenue': 'Ingresos',

  // ── FinalScreen ───────────────────────────────────────────────────
  'final.aria': 'Fin del juego — Resultados finales',
  'final.victory.headline': 'Dominio del cielo',
  'final.victory.subtitle': '{airlineName} alcanza el primer lugar',
  'final.defeat.headline': 'Fin del trayecto',
  'final.defeat.subtitle': '{airlineName} — Posición final: #{rank}',
  'final.standings.heading': 'Clasificación final',
  'final.stat.profit': 'Utilidad acumulada',
  'final.stat.pax': 'Pasajeros totales',
  'final.footer': '20 años / {endedTurn} turnos',
  'final.btn.restart': 'Jugar de nuevo',
  'final.pax.M': '{val}M pasajeros',
  'final.pax.K': '{val}K pasajeros',
  'final.pax.unit': '{val} pasajeros',

  // ── GameOverScreen ────────────────────────────────────────────────
  'gameover.aria': 'Fin del juego',
  'gameover.heading': 'Quiebra',
  'gameover.body': '{airlineName} tuvo efectivo negativo dos trimestres consecutivos y ha declarado quiebra. El imperio aéreo llega a su fin.',
  'gameover.btn.restart': 'Volver a empezar',

  // ── EventTicker ───────────────────────────────────────────────────
  'ticker.aria.region': 'Eventos activos',
  'ticker.label': 'Eventos',
  'ticker.severity.major': 'Grave',
  'ticker.severity.minor': 'Leve',
  'ticker.effect.demand': 'Demanda',
  'ticker.effect.fuelCost': 'Combustible',
  'ticker.effect.slotFee': 'Tasa aeroportuaria',
  'ticker.effect.serviceCost': 'Costo de servicio',
  'ticker.scope.global': 'Global',
  'ticker.effects.suffix': 'afecta {scope}',
  'ticker.remaining': '⏳ {n} trim. restantes',
  'ticker.sourceLink': 'Fuente',
  'ticker.aria.close': 'Cerrar',

  // ── SlotBadge ─────────────────────────────────────────────────────
  'slot.held': 'En mano {n}',
  'slot.used': 'En uso {n}',
  'slot.pool': 'Piscina {taken}/{capacity}',

  // ── CityCard ──────────────────────────────────────────────────────
  'city.aria.demand': 'Índice de demanda {value}/10',
  'city.chip.slots': 'Slots {n}',
  'city.chip.fee': '${n}K/op',

  // ── AircraftCard ──────────────────────────────────────────────────
  'aircraft.spec.seats': 'Asientos',
  'aircraft.spec.range': 'Alcance',
  'aircraft.spec.price': 'Precio',
  'aircraft.btn.buy': 'Comprar',
  'aircraft.btn.lease': 'Arrendar',

  // ── RoutesTab ─────────────────────────────────────────────────────
  'routes.open.heading': 'Abrir nueva ruta · Hub {hqCity}',
  'routes.dest.placeholder': 'Elegir destino (o toca ciudad en el mapa)…',
  'routes.dest.option': '{nameZh} {name} · Demanda {demand}/10',
  'routes.btn.open': 'Abrir',
  'routes.hq.tag': ' (HQ)',
  'routes.slot.gate': 'Ambos extremos necesitan 1 slot libre — negocia primero.',
  'routes.slot.full': 'Piscina llena',
  'routes.slot.negotiate': 'Negociar slot · {cost}',
  'routes.empty': 'Sin rutas aún. Abre una ruta desde tu hub y asigna aviones.',
  'routes.assigned.heading': 'Aviones asignados ({n})',
  'routes.assigned.none': 'Sin aviones asignados — esta ruta no genera capacidad.',
  'routes.aircraft.owned': 'Propio',
  'routes.aircraft.leased': 'Arrendado',
  'routes.aircraft.onOtherRoute': ' (en otra ruta)',
  'routes.assign.placeholder': 'Elegir avión disponible…',
  'routes.assign.aria': 'Seleccionar avión a asignar',
  'routes.assign.btn': 'Asignar',
  'routes.unassign.aria': 'Desasignar {aircraftId}',
  'routes.flights.heading': 'Vuelos semanales (un sentido)',
  'routes.flights.decrement': 'Reducir vuelos',
  'routes.flights.increment': 'Aumentar vuelos',
  'routes.fare.heading': 'Multiplicador de tarifa',
  'routes.fare.low': '0.6 Económico',
  'routes.fare.high': '1.6 Premium',
  'routes.fare.aria': 'Multiplicador de tarifa',
  'routes.cabin.aria': 'Configuración de cabina',
  'routes.cabin.heading': 'Configuración de cabina',
  'routes.cabin.error': 'Los porcentajes de cabina deben sumar 100 (actual: {sum})',
  'routes.service.heading': 'Nivel de servicio',
  'routes.service.aria': 'Nivel de servicio',
  'routes.cabin.confirm': 'Confirmar cabina',
  'routes.lastQ.heading': 'Último trimestre',
  'routes.lastQ.loadFactor': 'Factor de carga',
  'routes.lastQ.pax': 'Pasajeros',
  'routes.lastQ.profit': 'Utilidad',
  'routes.lastQ.empty': 'Ruta nueva — los datos aparecerán al liquidar.',
  'routes.btn.close': 'Cerrar ruta',
  'routes.subtitle': '{dist} · {aircraft} aviones · {flights} vuelos/sem · ×{fare}',
  'routes.dest.aria': 'Elegir ciudad destino',

  // ── FleetTab ──────────────────────────────────────────────────────
  'fleet.empty': 'Flota vacía. Ve al Mercado de aviones para comprar o arrendar tu primer avión.',
  'fleet.owned': 'Propio',
  'fleet.leased': 'Arrendado',
  'fleet.idle': 'Inactivo (los costos de tenencia siguen aplicando)',
  'fleet.flying': 'Volando {cityA} ⇌ {cityB}',
  'fleet.btn.unassign': 'Desasignar',
  'fleet.btn.sell': 'Vender{amount}',
  'fleet.sell.title': 'Valor residual {amount}',
  'fleet.btn.return': 'Devolver arrendamiento',

  // ── FinanceTab ────────────────────────────────────────────────────
  'finance.lastQ.heading': 'P&L último trimestre',
  'finance.lastQ.revenue': 'Ingresos',
  'finance.lastQ.cost': 'Costos',
  'finance.lastQ.profit': 'Utilidad neta',
  'finance.lastQ.empty': 'Primer trimestre aún sin liquidar.',
  'finance.share.heading': 'Cuota de mercado',
  'finance.share.empty': 'Disponible tras liquidar un trimestre.',
  'finance.share.background': 'Mercado de fondo / Otros',
  'finance.cash.heading': 'Tendencia de efectivo',
  'finance.history.heading': 'Utilidad trimestral',
  'finance.history.turn': 'Turno {turn}',

  // ── NewsTab ───────────────────────────────────────────────────────
  'news.heading': 'Este trimestre',
  'news.empty': 'Sin noticias este trimestre.',
  'news.kind.event': 'Evento',
  'news.kind.system': 'Sistema',
  'news.credits.heading': 'Créditos de imágenes',
  'news.credits.empty': 'Manifiesto de imágenes no generado; las imágenes faltantes usan siluetas.',
  'news.credits.filePage': 'Página del archivo',

  // ── Cabin (lib labels) ────────────────────────────────────────────
  'cabin.economy': 'Económica',
  'cabin.business': 'Ejecutiva',
  'cabin.first': 'Primera',
  'cabin.service.economy': 'Económico',
  'cabin.service.standard': 'Estándar',
  'cabin.service.premium': 'Premium',

  // ── Voice lines ───────────────────────────────────────────────────
  'voice.profit': '{name} dice: ¡Excelente trimestre! Ganancia ${M}B, {K}K pasajeros.',
  'voice.loss': '{name} dice: ¡Alerta de pérdidas! ${M}B de pérdida, {K}K pasajeros.',
  'voice.breakeven': '{name} dice: Trimestre equilibrado, {K}K pasajeros.',
  'voice.event': '{name} dice: Atención al evento: {headline}',

  // ── Advisor display names ─────────────────────────────────────────
  'advisor.0.name': 'Pres. Jin Mantang',
  'advisor.1.name': 'Dir. Fei Tianmei',
  'advisor.2.name': 'Asesor Yun Danfeng',

  // ── Sparkline ─────────────────────────────────────────────────────────
  'sparkline.empty': 'Sin historial aún',
  'sparkline.aria': 'Gráfico de historial de efectivo',
};

export default es;
