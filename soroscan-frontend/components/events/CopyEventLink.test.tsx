import * as React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import { buildEventUrl, CopyEventLink } from './CopyEventLink';

describe('buildEventUrl', () => {
  it('builds a URL containing a string event ID', () => {
    expect(buildEventUrl('event-123', 'https://soroscan.example/events')).toBe(
      'https://soroscan.example/events/event-123',
    );
  });

  it('builds a URL containing a numeric event ID', () => {
    expect(buildEventUrl(42, 'https://soroscan.example/events')).toBe(
      'https://soroscan.example/events/42',
    );
  });

  it('removes trailing slashes from the base URL', () => {
    expect(buildEventUrl('event-123', 'https://soroscan.example/events///')).toBe(
      'https://soroscan.example/events/event-123',
    );
  });

  it('encodes unsafe event ID characters', () => {
    expect(buildEventUrl('event/with spaces', 'https://soroscan.example/events')).toBe(
      'https://soroscan.example/events/event%2Fwith%20spaces',
    );
  });

  it('supports a relative base path', () => {
    expect(buildEventUrl('event-123', '/events')).toBe('/events/event-123');
  });
});

describe('CopyEventLink', () => {
  const writeText = jest.fn<Promise<void>, [string]>();

  beforeEach(() => {
    writeText.mockReset();
    writeText.mockResolvedValue(undefined);

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText,
      },
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders the Copy Link button', () => {
    render(<CopyEventLink eventId="event-123" baseUrl="https://soroscan.example/events" />);

    expect(
      screen.getByRole('button', {
        name: 'Copy link to event event-123',
      }),
    ).toBeInTheDocument();

    expect(screen.getByText('Copy Link')).toBeInTheDocument();
  });

  it('uses type button', () => {
    render(<CopyEventLink eventId="event-123" baseUrl="https://soroscan.example/events" />);

    expect(screen.getByTestId('copy-event-link')).toHaveAttribute('type', 'button');
  });

  it('copies a link containing the event ID', async () => {
    render(<CopyEventLink eventId="event-123" baseUrl="https://soroscan.example/events" />);

    fireEvent.click(screen.getByTestId('copy-event-link'));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith('https://soroscan.example/events/event-123');
    });
  });

  it('copies different event IDs correctly', async () => {
    const { rerender } = render(
      <CopyEventLink eventId="event-one" baseUrl="https://soroscan.example/events" />,
    );

    fireEvent.click(screen.getByTestId('copy-event-link'));

    await waitFor(() => {
      expect(writeText).toHaveBeenLastCalledWith('https://soroscan.example/events/event-one');
    });

    rerender(<CopyEventLink eventId="event-two" baseUrl="https://soroscan.example/events" />);

    fireEvent.click(screen.getByTestId('copy-event-link'));

    await waitFor(() => {
      expect(writeText).toHaveBeenLastCalledWith('https://soroscan.example/events/event-two');
    });
  });

  it('uses the browser origin by default', async () => {
    render(<CopyEventLink eventId="event-123" />);

    fireEvent.click(screen.getByTestId('copy-event-link'));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/events/event-123`);
    });
  });

  it('shows copied feedback after a successful copy', async () => {
    render(<CopyEventLink eventId="event-123" baseUrl="https://soroscan.example/events" />);

    fireEvent.click(screen.getByTestId('copy-event-link'));

    expect(await screen.findByText('Copied!')).toBeInTheDocument();

    expect(screen.getByTestId('copy-event-link')).toHaveAttribute(
      'aria-label',
      'Link copied for event event-123',
    );
  });

  it('resets the copied feedback after the configured duration', async () => {
    jest.useFakeTimers();

    render(
      <CopyEventLink
        eventId="event-123"
        baseUrl="https://soroscan.example/events"
        feedbackDuration={1000}
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId('copy-event-link'));

      await Promise.resolve();
    });

    expect(screen.getByText('Copied!')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(screen.getByText('Copy Link')).toBeInTheDocument();
  });

  it('shows an error state when clipboard copying fails', async () => {
    writeText.mockRejectedValueOnce(new Error('Clipboard unavailable'));

    render(<CopyEventLink eventId="event-123" baseUrl="https://soroscan.example/events" />);

    fireEvent.click(screen.getByTestId('copy-event-link'));

    expect(await screen.findByText('Copy Failed')).toBeInTheDocument();

    expect(screen.getByTestId('copy-event-link')).toHaveAttribute(
      'aria-label',
      'Copy failed for event event-123',
    );
  });

  it('supports custom button text', () => {
    render(
      <CopyEventLink
        eventId="event-123"
        baseUrl="https://soroscan.example/events"
        label="Share Event"
      />,
    );

    expect(screen.getByText('Share Event')).toBeInTheDocument();
  });

  it('supports additional button classes and attributes', () => {
    render(
      <CopyEventLink
        eventId="event-123"
        baseUrl="https://soroscan.example/events"
        className="custom-copy-class"
        title="Share this event"
      />,
    );

    expect(screen.getByTestId('copy-event-link')).toHaveClass('custom-copy-class');

    expect(screen.getByTestId('copy-event-link')).toHaveAttribute('title', 'Share this event');
  });

  it('can be disabled', () => {
    render(
      <CopyEventLink eventId="event-123" baseUrl="https://soroscan.example/events" disabled />,
    );

    expect(screen.getByTestId('copy-event-link')).toBeDisabled();
  });

  it('forwards its ref', () => {
    const ref = React.createRef<HTMLButtonElement>();

    render(
      <CopyEventLink ref={ref} eventId="event-123" baseUrl="https://soroscan.example/events" />,
    );

    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});
