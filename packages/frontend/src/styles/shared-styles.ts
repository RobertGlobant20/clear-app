import { css } from 'lit';

export const sharedStyles = css`
  :host {
    font-family: var(--font-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif);
    color: var(--color-text, #111);
  }

  .card {
    background: var(--color-surface, #f8f8f8);
    border: 1px solid var(--color-border, #e0e0e0);
    border-radius: var(--radius-lg, 8px);
    padding: var(--space-4, 1rem);
  }

  .label {
    font-size: var(--text-xs, 0.75rem);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted, #999);
    font-weight: 600;
  }

  .score {
    font-family: var(--font-mono, monospace);
    font-weight: 700;
  }

  .risk-low { color: var(--color-risk-low, #22c55e); }
  .risk-moderate { color: var(--color-risk-moderate, #f59e0b); }
  .risk-high { color: var(--color-risk-high, #ef4444); }
  .risk-critical { color: var(--color-risk-critical, #dc2626); }

  .btn {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2, 0.5rem);
    padding: var(--space-2, 0.5rem) var(--space-4, 1rem);
    border: 1px solid var(--color-border, #e0e0e0);
    border-radius: var(--radius, 4px);
    background: var(--color-bg, #fff);
    color: var(--color-text, #111);
    font-size: var(--text-sm, 0.875rem);
    font-family: inherit;
    cursor: pointer;
    transition: background 0.15s;
  }
  .btn:hover { background: var(--color-surface, #f8f8f8); }
  .btn-primary {
    background: var(--color-text, #111);
    color: var(--color-bg, #fff);
    border-color: var(--color-text, #111);
  }
  .btn-primary:hover { opacity: 0.9; }

  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
`;
