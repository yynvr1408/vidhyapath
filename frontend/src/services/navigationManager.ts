export type BackHandler = () => boolean;

interface RegisteredHandler {
  id: string;
  handler: BackHandler;
  priority: number;
}

type ToastListener = (message: string | null) => void;

class NavigationManager {
  private handlers: RegisteredHandler[] = [];
  private nextId = 1;
  private lastBackPressTime = 0;
  private exitToastTimeout: ReturnType<typeof setTimeout> | null = null;
  private toastListeners: Set<ToastListener> = new Set();
  private defaultBackAction: BackHandler | null = null;
  private isInitialized = false;

  public registerBackHandler(handler: BackHandler, priority: number = 0): () => void {
    const id = `back_handler_${this.nextId++}`;
    this.handlers.push({ id, handler, priority });
    this.handlers.sort((a, b) => b.priority - a.priority);
    return () => {
      this.handlers = this.handlers.filter((entry) => entry.id !== id);
    };
  }

  public setDefaultBackAction(action: BackHandler | null): void {
    this.defaultBackAction = action;
  }

  public onExitToast(listener: ToastListener): () => void {
    this.toastListeners.add(listener);
    return () => this.toastListeners.delete(listener);
  }

  public notifyExitToast(message: string | null): void {
    this.toastListeners.forEach((listener) => listener(message));
  }

  private handleRegisteredBackHandlers(): boolean {
    for (const entry of this.handlers) {
      try {
        if (entry.handler()) return true;
      } catch (err) {
        console.warn('Error executing back handler:', err);
      }
    }
    return false;
  }

  public async triggerBack(exitToastMessage: string = 'Press back again to exit'): Promise<boolean> {
    if (this.handleRegisteredBackHandlers()) {
      this.notifyExitToast(null);
      return true;
    }

    if (this.defaultBackAction) {
      try {
        if (this.defaultBackAction()) {
          this.notifyExitToast(null);
          return true;
        }
      } catch (err) {
        console.warn('Error in default back action:', err);
      }
    }

    const now = Date.now();
    if (now - this.lastBackPressTime < 2000) {
      this.notifyExitToast(null);
      return true;
    }

    this.lastBackPressTime = now;
    this.notifyExitToast(exitToastMessage);
    if (this.exitToastTimeout) clearTimeout(this.exitToastTimeout);
    this.exitToastTimeout = setTimeout(() => this.notifyExitToast(null), 2000);
    return false;
  }

  /** Escape dismisses the topmost registered modal. Browser Back stays with the router. */
  public init(_getExitMessage: () => string): () => void {
    if (this.isInitialized) return () => {};
    this.isInitialized = true;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || !this.handlers.length) return;
      if (this.handleRegisteredBackHandlers()) event.preventDefault();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      this.isInitialized = false;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }
}

export const navigationManager = new NavigationManager();
