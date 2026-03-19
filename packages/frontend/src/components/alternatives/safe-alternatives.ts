import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { sharedStyles } from '../../styles/shared-styles.js';
import type { AlternativeRoute } from '@frcs/shared';
import '../common/risk-badge.js';

@customElement('safe-alternatives')
export class SafeAlternatives extends LitElement {
  @property({ type: Array }) alternatives: AlternativeRoute[] = [];

  static styles = [sharedStyles, css`
    :host { display: block; }
    .header {
      font-size: var(--text-xs, 0.75rem);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-text-muted, #999);
      font-weight: 600;
      margin-bottom: var(--space-3, 0.75rem);
    }
    .alt {
      padding: var(--space-4, 1rem);
      border: 1px solid var(--color-border, #e0e0e0);
      border-radius: var(--radius, 4px);
      margin-bottom: var(--space-2, 0.5rem);
    }
    .alt-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-2, 0.5rem);
    }
    .alt-name { font-weight: 600; }
    .tradeoffs {
      display: flex;
      gap: var(--space-4, 1rem);
      font-size: var(--text-sm, 0.875rem);
      color: var(--color-text-secondary, #666);
      margin-bottom: var(--space-2, 0.5rem);
    }
    .tradeoff {
      display: flex;
      flex-direction: column;
    }
    .tradeoff-label {
      font-size: var(--text-xs, 0.75rem);
      color: var(--color-text-muted, #999);
    }
    .tradeoff-value {
      font-family: var(--font-mono, monospace);
      font-weight: 600;
    }
    .reasoning {
      font-size: var(--text-sm, 0.875rem);
      color: var(--color-text-secondary, #666);
      line-height: 1.5;
    }
  `];

  render() {
    if (this.alternatives.length === 0) return nothing;
    return html`
      <div class="header">Safer alternatives</div>
      ${this.alternatives.map(alt => html`
        <div class="alt">
          <div class="alt-header">
            <span class="alt-name">${alt.description}</span>
            <risk-badge .level=${alt.riskLevel} .score=${alt.score}></risk-badge>
          </div>
          <div class="tradeoffs">
            <div class="tradeoff">
              <span class="tradeoff-label">Extra distance</span>
              <span class="tradeoff-value">+${alt.extraDistanceKm.toLocaleString()} km</span>
            </div>
            <div class="tradeoff">
              <span class="tradeoff-label">Extra time</span>
              <span class="tradeoff-value">+${alt.extraTimeMinutes} min</span>
            </div>
            <div class="tradeoff">
              <span class="tradeoff-label">Stops</span>
              <span class="tradeoff-value">${alt.stops}</span>
            </div>
          </div>
          <div class="reasoning">${alt.reasoning}</div>
        </div>
      `)}
    `;
  }
}
