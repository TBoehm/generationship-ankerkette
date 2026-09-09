import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App from './App.jsx';
import './infrastructure/i18n/index.js';
import de from './locales/de.json';

vi.mock('./presentation/hooks/useScene.js', () => ({
  useScene: () => ({ current: null }),
}));

function renderAt(path) {
  return render(
    <MemoryRouter
      initialEntries={[path]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <App />
    </MemoryRouter>
  );
}

describe('App', () => {
  it('opens straight into the combined view, with no page in front of it', () => {
    renderAt('/');
    expect(screen.getByRole('heading', { name: /Ankerkette/ })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: de.focus.label })).toBeInTheDocument();
  });

  it('starts on the journey and shows its controls', () => {
    renderAt('/');
    expect(screen.getByRole('button', { name: de.flight.play })).toBeInTheDocument();
    expect(screen.getByLabelText(de.flight.position)).toBeInTheDocument();
  });

  it('switches to the ship without leaving the view', async () => {
    renderAt('/');
    await userEvent.click(screen.getByRole('button', { name: de.focus.ship }));
    await waitFor(() => expect(screen.getByText(de.sheet.index)).toBeInTheDocument());
    expect(screen.getByRole('group', { name: de.focus.label })).toBeInTheDocument();
  });

  it('opens on the ship when the deep link asks for it', async () => {
    renderAt('/ship');
    await waitFor(() => expect(screen.getByText(de.sheet.index)).toBeInTheDocument());
  });

  it('shows the derived hull figures while the ship is in focus', async () => {
    renderAt('/ship');
    // 216.770 is derived from the deck geometry, not written into the view.
    await waitFor(() => expect(screen.getByText('216.770')).toBeInTheDocument());
    expect(screen.getByText('539.000')).toBeInTheDocument();
  });

  it('walks from the index into a section and back out again', async () => {
    renderAt('/ship');
    const ringName = de.ship.section.ringA.name;
    await userEvent.click(await screen.findByRole('button', { name: new RegExp(ringName) }));
    expect(screen.getByText(de.ship.deck.ringA['1'].name)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: de.sheet.index }));
    expect(screen.getAllByRole('button', { name: new RegExp(ringName) }).length).toBeGreaterThan(0);
  });

  it('reaches a deck plan and its room level detail', async () => {
    renderAt('/ship');
    await userEvent.click(
      await screen.findByRole('button', { name: new RegExp(de.ship.section.ringA.name) })
    );
    await userEvent.click(
      screen.getByRole('button', { name: new RegExp(de.ship.deck.ringA['1'].name) })
    );
    expect(screen.getByRole('img', { name: de.sheet.plan })).toBeInTheDocument();
    // The note belongs to this deck alone, unlike the sector length, which the
    // plan also prints along its bottom edge.
    expect(screen.getByText(de.ship.deck.ringA['1'].note)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: de.ship.room.ringA['1'].dwellingBlockA.name })
    ).toBeInTheDocument();
  });

  it('falls back to the combined view on an unknown path', () => {
    renderAt('/gibtesnicht');
    expect(screen.getByRole('group', { name: de.focus.label })).toBeInTheDocument();
  });
});
