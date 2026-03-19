import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { sharedStyles } from '../../styles/shared-styles.js';
import type { RiskScore } from '@frcs/shared';
import '../common/score-gauge.js';
import '../common/risk-badge.js';

@customElement('risk-dashboard')
export class RiskDashboard extends LitElement {
  @property({ type: Object }) risk: RiskScore | null = null;

  static styles = [sharedStyles, css`
    :host { display: block; }
    .dashboard {
      padding: var(--space-4, 1rem);
      border: 1px solid var(--color-border, #e0e0e0);
      border-radius: var(--radius-lg, 8px);
    }
    .header {
      font-size: var(--text-xs, 0.75rem);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-text-muted, #999);
      font-weight: 600;
      margin-bottom: var(--space-4, 1rem);
    }
    .summary {
      font-size: var(--text-sm, 0.875rem);
      line-height: 1.6;
      color: var(--color-text-secondary, #666);
      margin: var(--space-4, 1rem) 0;
    }
    .factors {
      display: flex;
      flex-direction: column;
      gap: var(--space-2, 0.5rem);
      margin-top: var(--space-4, 1rem);
    }
    .factor {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-2, 0.5rem) 0;
      border-bottom: 1px solid var(--color-border, #e0e0e0);
      font-size: var(--text-sm, 0.875rem);
    }
    .factor:last-child { border-bottom: none; }
    .factor-name { font-weight: 500; }
    .factor-score {
      font-family: var(--font-mono, monospace);
      font-weight: 700;
    }
    .factor-desc {
      font-size: var(--text-xs, 0.75rem);
      color: var(--color-text-muted, #999);
      margin-top: 0.125rem;
    }
    .factor-weight {
      font-size: var(--text-xs, 0.75rem);
      color: var(--color-text-muted, #999);
    }
  `];

  render() {
    if (!this.risk) return nothing;
    return html`
      <div class="dashboard">
        <div class="header">Cancellation Risk Assessment</div>
        <score-gauge .value=${this.risk.overall} label="Cancellation Risk"></score-gauge>
        <div class="summary">${this.risk.summary}</div>
        <div class="factors">
          ${this.risk.factors.map(f => html`
            <div class="factor">
              <div>
                <div class="factor-name">${f.name}</div>
                <div class="factor-desc">${f.description}</div>
              </div>
              <div style="text-align:right">
                <div class="factor-score">${f.score}</div>
                <div class="factor-weight">${Math.round(f.weight * 100)}% weight</div>
              </div>
            </div>
          `)}
        </div>
      </div>
    `;
  }
}
