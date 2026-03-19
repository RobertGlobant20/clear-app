import type { ReactiveController, ReactiveControllerHost } from 'lit';
import { store, type AppState } from './store.js';

export class StoreController implements ReactiveController {
  private host: ReactiveControllerHost;
  private unsub: (() => void) | null = null;

  constructor(host: ReactiveControllerHost) {
    this.host = host;
    host.addController(this);
  }

  get state(): AppState {
    return store.getState();
  }

  hostConnected(): void {
    this.unsub = store.subscribe(() => {
      this.host.requestUpdate();
    });
  }

  hostDisconnected(): void {
    this.unsub?.();
    this.unsub = null;
  }
}
