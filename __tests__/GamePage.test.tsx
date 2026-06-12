import { render, screen, fireEvent } from '@testing-library/react';
import GamePage from '@/app/game/page';

describe('GamePage', () => {
  it('renders the battlefield headline and the full build menu', () => {
    const { unmount } = render(<GamePage />);
    expect(screen.getByText('僵尸守城 · 三国风战场')).toBeInTheDocument();
    for (const name of [
      '步兵营', '弓兵营', '强弩营', '骑兵营', '南蛮营', '水兵营',
      '兽栏', '火箭营', '攻城车厂', '投石车厂', '木筏坞', '战船坞', '堡垒',
    ]) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
    unmount();
  });

  it('lets the player select a building and click the map without crashing', () => {
    const { container, unmount } = render(<GamePage />);
    fireEvent.click(screen.getByText('步兵营'));
    const canvas = container.querySelector('canvas');
    expect(canvas).not.toBeNull();
    fireEvent.mouseMove(canvas!, { clientX: 10, clientY: 10 });
    fireEvent.click(canvas!, { clientX: 10, clientY: 10 });
    fireEvent.contextMenu(canvas!);
    unmount();
  });
});
