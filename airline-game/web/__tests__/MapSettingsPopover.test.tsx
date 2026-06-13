/**
 * V3.2 — MapSettingsPopover tests.
 * Covers: renders 3 projection options + 3 theme options, persistence to
 * localStorage, selection feedback.
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createElement } from 'react';
import { I18nProvider } from '@/i18n';
import { MapSettingsPopover, PROJECTION_STORAGE_KEY, THEME_STORAGE_KEY } from '@/components/MapSettingsPopover';

const wrap = (node: React.ReactNode) => createElement(I18nProvider, null, node);

const defaultProps = {
  projectionId: 'naturalEarth' as const,
  themeId: 'dark-ops' as const,
  onProjectionChange: jest.fn(),
  onThemeChange: jest.fn(),
};

describe('MapSettingsPopover', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('renders the settings gear button', () => {
    render(wrap(createElement(MapSettingsPopover, defaultProps)));
    expect(screen.getByTestId('map-settings-btn')).toBeInTheDocument();
  });

  it('popover is hidden by default', () => {
    render(wrap(createElement(MapSettingsPopover, defaultProps)));
    expect(screen.queryByTestId('map-settings-popover')).not.toBeInTheDocument();
  });

  it('clicking gear opens the popover', async () => {
    render(wrap(createElement(MapSettingsPopover, defaultProps)));
    await userEvent.click(screen.getByTestId('map-settings-btn'));
    expect(screen.getByTestId('map-settings-popover')).toBeInTheDocument();
  });

  it('popover shows exactly 3 projection options', async () => {
    render(wrap(createElement(MapSettingsPopover, defaultProps)));
    await userEvent.click(screen.getByTestId('map-settings-btn'));
    expect(screen.getByTestId('projection-option-naturalEarth')).toBeInTheDocument();
    expect(screen.getByTestId('projection-option-globe')).toBeInTheDocument();
    expect(screen.getByTestId('projection-option-mercator')).toBeInTheDocument();
  });

  it('popover shows exactly 3 theme options', async () => {
    render(wrap(createElement(MapSettingsPopover, defaultProps)));
    await userEvent.click(screen.getByTestId('map-settings-btn'));
    expect(screen.getByTestId('theme-option-dark-ops')).toBeInTheDocument();
    expect(screen.getByTestId('theme-option-light-day')).toBeInTheDocument();
    expect(screen.getByTestId('theme-option-retro-chart')).toBeInTheDocument();
  });

  it('clicking a projection option calls onProjectionChange', async () => {
    const onProjectionChange = jest.fn();
    render(wrap(createElement(MapSettingsPopover, { ...defaultProps, onProjectionChange })));
    await userEvent.click(screen.getByTestId('map-settings-btn'));
    await userEvent.click(screen.getByTestId('projection-option-globe'));
    expect(onProjectionChange).toHaveBeenCalledWith('globe');
  });

  it('clicking a theme option calls onThemeChange', async () => {
    const onThemeChange = jest.fn();
    render(wrap(createElement(MapSettingsPopover, { ...defaultProps, onThemeChange })));
    await userEvent.click(screen.getByTestId('map-settings-btn'));
    await userEvent.click(screen.getByTestId('theme-option-light-day'));
    expect(onThemeChange).toHaveBeenCalledWith('light-day');
  });

  it('clicking a projection persists to localStorage', async () => {
    render(wrap(createElement(MapSettingsPopover, defaultProps)));
    await userEvent.click(screen.getByTestId('map-settings-btn'));
    await userEvent.click(screen.getByTestId('projection-option-mercator'));
    expect(localStorage.getItem(PROJECTION_STORAGE_KEY)).toBe('mercator');
  });

  it('clicking a theme persists to localStorage', async () => {
    render(wrap(createElement(MapSettingsPopover, defaultProps)));
    await userEvent.click(screen.getByTestId('map-settings-btn'));
    await userEvent.click(screen.getByTestId('theme-option-retro-chart'));
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('retro-chart');
  });

  it('the currently active projection button has aria-pressed=true', async () => {
    render(wrap(createElement(MapSettingsPopover, { ...defaultProps, projectionId: 'globe' })));
    await userEvent.click(screen.getByTestId('map-settings-btn'));
    expect(screen.getByTestId('projection-option-globe').getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByTestId('projection-option-naturalEarth').getAttribute('aria-pressed')).toBe('false');
  });

  it('the currently active theme button has aria-pressed=true', async () => {
    render(wrap(createElement(MapSettingsPopover, { ...defaultProps, themeId: 'light-day' })));
    await userEvent.click(screen.getByTestId('map-settings-btn'));
    expect(screen.getByTestId('theme-option-light-day').getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByTestId('theme-option-dark-ops').getAttribute('aria-pressed')).toBe('false');
  });
});
