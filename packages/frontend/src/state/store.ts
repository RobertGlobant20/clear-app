import type { ScanResponse, Advisory, AnomalyResult, AirlineProfile } from '@frcs/shared';

export interface AppState {
  scanLoading: boolean;
  scanResult: ScanResponse | null;
  scanError: string | null;
  advisories: Advisory[];
  advisoriesLoading: boolean;
  anomalies: AnomalyResult[];
  airlineProfiles: AirlineProfile[];
  activeView: 'scanner' | 'airlines' | 'anomalies';
}

type Listener = () => void;

class Store {
  private state: AppState = {
    scanLoading: false,
    scanResult: null,
    scanError: null,
    advisories: [],
    advisoriesLoading: false,
    anomalies: [],
    airlineProfiles: [],
    activeView: 'scanner',
  };

  private listeners = new Set<Listener>();

  getState(): AppState {
    return this.state;
  }

  update(partial: Partial<AppState>): void {
    this.state = { ...this.state, ...partial };
    this.listeners.forEach(fn => fn());
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
}

export const store = new Store();
