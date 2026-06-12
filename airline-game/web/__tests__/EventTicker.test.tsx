/**
 * M3.1 — EventTicker component tests.
 * Covers: pills with remaining turns + severity styling, hidden when empty,
 * popover with translated effects/scope, news event badge in NewsTab.
 */
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EventTicker } from '@/components/EventTicker';
import { NewsTab } from '@/components/tabs/NewsTab';
import type { ActiveEvent, NewsItem } from '@/types';

// ---- fixtures ----------------------------------------------------------

const makeActiveEvent = (overrides: Partial<ActiveEvent> = {}): ActiveEvent => ({
  id: 'evt-fuel-spike',
  source: 'static',
  headline: '原油价格飙升',
  detail: '全球航空燃油成本大幅上涨。',
  scope: { kind: 'global', ids: [] },
  effects: [{ target: 'fuelCost', mult: 1.4 }],
  durationTurns: 3,
  severity: 'major',
  startedTurn: 5,
  remainingTurns: 2,
  ...overrides,
});

const makeMinorEvent = (overrides: Partial<ActiveEvent> = {}): ActiveEvent =>
  makeActiveEvent({
    id: 'evt-tourism-boost',
    headline: '东京旅游热潮',
    severity: 'minor',
    scope: { kind: 'city', ids: ['hnd'] },
    effects: [{ target: 'demand', mult: 1.3 }],
    remainingTurns: 1,
    ...overrides,
  });

// ---- EventTicker -------------------------------------------------------

describe('EventTicker', () => {
  it('renders nothing when activeEvents is empty', () => {
    const { container } = render(<EventTicker events={[]} />);
    expect(container.firstChild).toBeNull();
    expect(screen.queryByTestId('event-ticker')).not.toBeInTheDocument();
  });

  it('renders the ticker strip when there are active events', () => {
    render(<EventTicker events={[makeActiveEvent()]} />);
    expect(screen.getByTestId('event-ticker')).toBeInTheDocument();
  });

  it('renders a pill for each active event', () => {
    render(<EventTicker events={[makeActiveEvent(), makeMinorEvent()]} />);
    expect(screen.getByTestId('event-pill-evt-fuel-spike')).toBeInTheDocument();
    expect(screen.getByTestId('event-pill-evt-tourism-boost')).toBeInTheDocument();
  });

  it('shows remaining turns in each pill', () => {
    render(<EventTicker events={[makeActiveEvent({ remainingTurns: 3 })]} />);
    const pill = screen.getByTestId('event-pill-evt-fuel-spike');
    expect(within(pill).getByTestId('remaining-turns')).toHaveTextContent('剩 3 季');
  });

  it('applies red severity dot for major events', () => {
    render(<EventTicker events={[makeActiveEvent({ severity: 'major' })]} />);
    const pill = screen.getByTestId('event-pill-evt-fuel-spike');
    const dot = within(pill).getByTestId('severity-dot-major');
    expect(dot).toHaveClass('bg-red-400');
  });

  it('applies amber severity dot for minor events', () => {
    render(<EventTicker events={[makeMinorEvent()]} />);
    const pill = screen.getByTestId('event-pill-evt-tourism-boost');
    const dot = within(pill).getByTestId('severity-dot-minor');
    expect(dot).toHaveClass('bg-amber-400');
  });

  it('shows the event headline text in the pill', () => {
    render(<EventTicker events={[makeActiveEvent()]} />);
    expect(screen.getByTestId('event-pill-evt-fuel-spike')).toHaveTextContent('原油价格飙升');
  });

  // ---- popover on tap --------------------------------------------------

  it('opens a popover when a pill is clicked', async () => {
    render(<EventTicker events={[makeActiveEvent()]} />);
    expect(screen.queryByTestId('event-popover')).not.toBeInTheDocument();

    await userEvent.click(screen.getByTestId('event-pill-evt-fuel-spike'));

    expect(screen.getByTestId('event-popover')).toBeInTheDocument();
  });

  it('closes the popover when the close button is clicked', async () => {
    render(<EventTicker events={[makeActiveEvent()]} />);
    await userEvent.click(screen.getByTestId('event-pill-evt-fuel-spike'));
    expect(screen.getByTestId('event-popover')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '关闭' }));

    expect(screen.queryByTestId('event-popover')).not.toBeInTheDocument();
  });

  it('toggles the popover closed when the same pill is clicked again', async () => {
    render(<EventTicker events={[makeActiveEvent()]} />);
    await userEvent.click(screen.getByTestId('event-pill-evt-fuel-spike'));
    expect(screen.getByTestId('event-popover')).toBeInTheDocument();

    await userEvent.click(screen.getByTestId('event-pill-evt-fuel-spike'));

    expect(screen.queryByTestId('event-popover')).not.toBeInTheDocument();
  });

  // ---- popover contents ------------------------------------------------

  it('popover shows translated effect target (fuelCost → 燃油)', async () => {
    render(<EventTicker events={[makeActiveEvent()]} />);
    await userEvent.click(screen.getByTestId('event-pill-evt-fuel-spike'));

    const popover = screen.getByTestId('event-popover');
    expect(within(popover).getByTestId('event-effects-summary')).toHaveTextContent('燃油 ×1.4');
  });

  it('popover shows translated effect target (demand → 需求)', async () => {
    render(<EventTicker events={[makeMinorEvent()]} />);
    await userEvent.click(screen.getByTestId('event-pill-evt-tourism-boost'));

    const popover = screen.getByTestId('event-popover');
    expect(within(popover).getByTestId('event-effects-summary')).toHaveTextContent('需求 ×1.3');
  });

  it('popover shows global scope label (全球) for global events', async () => {
    render(<EventTicker events={[makeActiveEvent({ scope: { kind: 'global', ids: [] } })]} />);
    await userEvent.click(screen.getByTestId('event-pill-evt-fuel-spike'));

    const popover = screen.getByTestId('event-popover');
    expect(within(popover).getByTestId('event-effects-summary')).toHaveTextContent('全球');
  });

  it('popover shows city nameZh for city-scope events', async () => {
    render(<EventTicker events={[makeMinorEvent({ scope: { kind: 'city', ids: ['hnd'] } })]} />);
    await userEvent.click(screen.getByTestId('event-pill-evt-tourism-boost'));

    const popover = screen.getByTestId('event-popover');
    // hnd.nameZh = "东京"
    expect(within(popover).getByTestId('event-effects-summary')).toHaveTextContent('东京');
  });

  it('popover shows route scope as city pair for route-scope events', async () => {
    const routeEvent = makeActiveEvent({
      scope: { kind: 'route', ids: ['nyc', 'lhr'] },
    });
    render(<EventTicker events={[routeEvent]} />);
    await userEvent.click(screen.getByTestId('event-pill-evt-fuel-spike'));

    const popover = screen.getByTestId('event-popover');
    // nyc.nameZh = "纽约", lhr.nameZh = "伦敦"
    expect(within(popover).getByTestId('event-effects-summary')).toHaveTextContent('纽约');
    expect(within(popover).getByTestId('event-effects-summary')).toHaveTextContent('伦敦');
  });

  it('popover shows remaining turns', async () => {
    render(<EventTicker events={[makeActiveEvent({ remainingTurns: 4 })]} />);
    await userEvent.click(screen.getByTestId('event-pill-evt-fuel-spike'));

    const popover = screen.getByTestId('event-popover');
    expect(within(popover).getByText(/剩 4 季/)).toBeInTheDocument();
  });

  it('popover shows sourceUrl link for news events', async () => {
    const newsEvent = makeActiveEvent({
      source: 'news',
      sourceUrl: 'https://example.com/news',
    });
    render(<EventTicker events={[newsEvent]} />);
    await userEvent.click(screen.getByTestId('event-pill-evt-fuel-spike'));

    const popover = screen.getByTestId('event-popover');
    const link = within(popover).getByRole('link', { name: '原文链接' });
    expect(link).toHaveAttribute('href', 'https://example.com/news');
  });

  it('popover omits sourceUrl link when not present', async () => {
    render(<EventTicker events={[makeActiveEvent({ sourceUrl: undefined })]} />);
    await userEvent.click(screen.getByTestId('event-pill-evt-fuel-spike'));

    const popover = screen.getByTestId('event-popover');
    expect(within(popover).queryByRole('link')).not.toBeInTheDocument();
  });

  it('multiple effects are all shown in the summary', async () => {
    const multiEffect = makeActiveEvent({
      effects: [
        { target: 'fuelCost', mult: 1.5 },
        { target: 'slotFee', mult: 0.9 },
      ],
    });
    render(<EventTicker events={[multiEffect]} />);
    await userEvent.click(screen.getByTestId('event-pill-evt-fuel-spike'));

    const summary = screen.getByTestId('event-effects-summary');
    expect(summary).toHaveTextContent('燃油 ×1.5');
    expect(summary).toHaveTextContent('机场费 ×0.9');
  });
});

// ---- NewsTab event badge -----------------------------------------------

describe('NewsTab event badge', () => {
  it('renders an amber 事件 badge for kind="event" news items', () => {
    const news: NewsItem[] = [
      { headline: '燃油价格上涨', kind: 'event' },
    ];
    render(<NewsTab news={news} />);

    const badge = screen.getByText('事件');
    expect(badge).toBeInTheDocument();
    // amber: bg-accent class
    expect(badge).toHaveClass('bg-accent');
  });

  it('renders a 系统 badge for kind="system" news items', () => {
    const news: NewsItem[] = [
      { headline: 'Aurora Pacific 开通新航线', kind: 'system' },
    ];
    render(<NewsTab news={news} />);

    const badge = screen.getByText('系统');
    expect(badge).toBeInTheDocument();
    expect(badge).not.toHaveClass('bg-accent');
  });

  it('renders both event and system badges when mixed', () => {
    const news: NewsItem[] = [
      { headline: '油价飙升', kind: 'event' },
      { headline: '新航线', kind: 'system' },
    ];
    render(<NewsTab news={news} />);

    expect(screen.getByText('事件')).toBeInTheDocument();
    expect(screen.getByText('系统')).toBeInTheDocument();
  });

  it('event badge is distinct from system badge (different classes)', () => {
    const news: NewsItem[] = [
      { headline: '油价', kind: 'event' },
      { headline: '新线', kind: 'system' },
    ];
    render(<NewsTab news={news} />);

    const eventBadge = screen.getByText('事件');
    const systemBadge = screen.getByText('系统');
    // They should have different class sets — event has bg-accent, system does not.
    expect(eventBadge.className).not.toBe(systemBadge.className);
  });
});
