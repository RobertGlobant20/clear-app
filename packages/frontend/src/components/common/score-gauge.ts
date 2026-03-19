import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('score-gauge')
export class ScoreGauge extends LitElement {
  @property({ type: Number }) value = 0;
  @property() label = 'Risk Score';

  static styles = css`
    :host { display: block; }
    .gauge {
      text-align: center;
    }
    .value {
      font-family: var(--font-mono, monospace);
      font-size: 3rem;
      font-weight: 800;
      line-height: 1;
    }
    .label {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-text-muted, #999);
      margin-top: 0.25rem;
    }
    .bar {
      margin-top: 0.75rem;
      height: 4px;
      background: var(--color-border, #e0e0e0);
      border-radius: 2px;
      overflow: hidden;
    }
    .fill {
      height: 100%;
      border-radius: 2px;
      transition: width 0.5s ease;
    }
    .low { color: var(--color-risk-low, #22c55e); }
    .low .fill { background: var(--color-risk-low, #22c55e); }
    .moderate { color: var(--color-risk-moderate, #f59e0b); }
    .moderate .fill { background: var(--color-risk-moderate, #f59e0b); }
    .high { color: var(--color-risk-high, #ef4444); }
    .high .fill { background: var(--color-risk-high, #ef4444); }
    .critical { color: var(--color-risk-critical, #dc2626); }
    .critical .fill { background: var(--color-risk-critical, #dc2626); }
  `;

  private get riskClass(): string {
    if (this.value < 30) return 'low';
    if (this.value < 60) return 'moderate';
    if (this.value < 80) return 'high';
    return 'critical';
  }

  render() {
    return html`
      <div class="gauge ${this.riskClass}">
        <div class="value">${this.value}</div>
        <div class="label">${this.label}</div>
        <div class="bar">
          <div class="fill" style="width: ${this.value}%"></div>
        </div>
      </div>
    `;
  }
}
