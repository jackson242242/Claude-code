import { render, screen, fireEvent, act } from '@testing-library/react';
import { ChatWidget, ASK_EVENT } from '@/components/ChatWidget';

describe('ChatWidget', () => {
  beforeEach(() => {
    // No readable body in jsdom → the widget uses its non-stream text() fallback.
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      body: null,
      text: async () => 'Mexico City hosts the opener.',
    }) as unknown as typeof fetch;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders a launcher and stays closed by default', () => {
    render(<ChatWidget />);
    expect(
      screen.getByRole('button', { name: /open travel assistant/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Matchday26 Concierge/i)).not.toBeInTheDocument();
  });

  it('opens the panel and shows the greeting', () => {
    render(<ChatWidget />);
    fireEvent.click(
      screen.getByRole('button', { name: /open travel assistant/i }),
    );
    expect(
      screen.getByText(/I'm your Matchday26 concierge/i),
    ).toBeInTheDocument();
  });

  it('sends a message and renders the assistant reply', async () => {
    render(<ChatWidget />);
    fireEvent.click(
      screen.getByRole('button', { name: /open travel assistant/i }),
    );

    fireEvent.change(screen.getByPlaceholderText(/ask about cities/i), {
      target: { value: 'Where is the opener?' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send message/i }));

    expect(
      await screen.findByText('Mexico City hosts the opener.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Where is the opener?')).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/assistant',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('opens and sends when a matchday:ask event fires', async () => {
    render(<ChatWidget />);
    act(() => {
      window.dispatchEvent(
        new CustomEvent(ASK_EVENT, {
          detail: { question: 'Help me plan a trip to Dallas.' },
        }),
      );
    });

    expect(
      await screen.findByText('Help me plan a trip to Dallas.'),
    ).toBeInTheDocument();
    expect(
      await screen.findByText('Mexico City hosts the opener.'),
    ).toBeInTheDocument();
  });

  it('sends a quick reply when one is clicked', async () => {
    render(<ChatWidget />);
    fireEvent.click(
      screen.getByRole('button', { name: /open travel assistant/i }),
    );
    fireEvent.click(
      screen.getByRole('button', {
        name: /which cities host the most matches/i,
      }),
    );
    expect(
      await screen.findByText('Mexico City hosts the opener.'),
    ).toBeInTheDocument();
  });
});
