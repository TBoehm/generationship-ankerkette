import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App from './App.jsx';
import './infrastructure/i18n/index.js';
import de from './locales/de.json';

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
  it('shows the overview with the derived deck area on the root route', () => {
    renderAt('/');
    expect(screen.getByText('216.770')).toBeInTheDocument();
  });

  it('formats figures for the active language', () => {
    renderAt('/');
    expect(screen.getByText('4,2465')).toBeInTheDocument();
  });

  it('navigates to the ship view', async () => {
    renderAt('/');
    await userEvent.click(screen.getByRole('link', { name: de.nav.ship }));
    expect(screen.getByText(de.pending.title)).toBeInTheDocument();
  });

  it('redirects an unknown route to the overview', () => {
    renderAt('/gibtesnicht');
    expect(screen.getByText('216.770')).toBeInTheDocument();
  });
});
