import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { RiskLevel } from '@frcs/shared';

@customElement('risk-badge')
export class RiskBadge extends LitElement {
  @property() level: RiskLevel = 'low';
  @property({ type: Number }) score: number | null = null;

  static styles = css`
    :host { display: inline-flex; }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.125rem 0.5rem;
      border-radius: 2px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-family: var(--font-mono, monospace);
    }
    .low { background: #dcfce7; color: #166534; }
    .moderate { background: #fef3c7; color: #92400e; }
    .high { background: #fee2e2; color: #991b1b; }
    .critical { background: #dc2626; color: #fff; }
  `;

  render() {
    return html`
      <span class="badge ${this.level}">
        ${this.score !== null ? html`${this.score}` : ''}
        ${this.level}
      </span>
    `;
  }
}
