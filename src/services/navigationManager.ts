// Navigation & Hardware Back-Button Manager for Android Capacitor & Mobile Web
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';

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
  private exitToastTimeout: any = null;
  private toastListeners: Set<ToastListener> = new Set();
  private defaultBackAction: (() => boolean) | null = null;
  private isInitialized = false;

  /**
   * Register a custom back-button handler (e.g. for an active modal or slide-over drawer).
   * Handlers with higher priority are executed first.
   * Return `true` in your handler if you handled the back action.
   */
  public registerBackHandler(handler: BackHandler, priority: number = 50): () => void {
    const id = `handler_${this.nextId++}`;
    this.handlers.push({ id, handler, priority });
    this.handlers.sort((a, b) => b.priority - a.priority);

    return () => {
      this.handlers = this.handlers.filter((h) => h.id !== id);
    };
  }

  /**
   * Set default fallback back action when no registered modal or view handles it.
   */
  public setDefaultBackAction(action: (() => boolean) | null): void {
    this.defaultBackAction = action;
  }

  /**
   * Subscribe to back-to-exit toast notifications.
   */
  public onExitToast(listener: ToastListener): () => void {
    this.toastListeners.add(listener);
    return () => {
      this.toastListeners.delete(listener);
    };
  }

  public notifyExitToast(message: string | null): void {
    for (const listener of this.toastListeners) {
      try {
        listener(message);
      } catch (err) {
        console.error('Exit toast listener error:', err);
      }
    }
  }

  /**
   * Trigger back action handling across registered handlers and native platform.
   */
  public async triggerBack(exitToastMessage: string = 'Press back again to exit'): Promise<boolean> {
    // 1. Check registered modal / view handlers from highest priority to lowest
    for (const entry of this.handlers) {
      try {
        const handled = entry.handler();
        if (handled) {
          // Cleared any pending exit toast
          this.notifyExitToast(null);
          return true;
        }
      } catch (err) {
        console.warn('Error executing back handler:', err);
      }
    }

    // 2. Fallback to default screen back action (e.g., return to MY_SYLLABUS)
    if (this.defaultBackAction) {
      try {
        const handled = this.defaultBackAction();
        if (handled) {
          this.notifyExitToast(null);
          return true;
        }
      } catch (err) {
        console.warn('Error in default back action:', err);
      }
    }

    // 3. User is at root screen: double-tap back within 2000ms exits app
    const now = Date.now();
    if (now - this.lastBackPressTime < 2000) {
      // Exit app
      this.notifyExitToast(null);
      if (Capacitor.isNativePlatform()) {
        try {
          await CapApp.exitApp();
        } catch (e) {
          console.warn('Capacitor exitApp failed:', e);
        }
      }
      return true;
    }

    // First tap at root: show toast notification
    this.lastBackPressTime = now;
    this.notifyExitToast(exitToastMessage);

    if (this.exitToastTimeout) {
      clearTimeout(this.exitToastTimeout);
    }
    this.exitToastTimeout = setTimeout(() => {
      this.notifyExitToast(null);
    }, 2000);

    return false;
  }

  /**
   * Initialize native Capacitor & browser popstate listener.
   */
  public init(getExitMessage: () => string): () => void {
    if (this.isInitialized) return () => {};
    this.isInitialized = true;

    // A. Native Android Back Button via @capacitor/app
    let capListenerHandle: any = null;
    if (Capacitor.isNativePlatform()) {
      CapApp.addListener('backButton', async (event) => {
        // canGoBack is provided by Capacitor WebView
        await this.triggerBack(getExitMessage());
      }).then((handle) => {
        capListenerHandle = handle;
      });
    }

    // B. Browser popstate & Escape key support for mobile web & desktop
    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      this.triggerBack(getExitMessage());
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.triggerBack(getExitMessage());
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      this.isInitialized = false;
      if (capListenerHandle && typeof capListenerHandle.remove === 'function') {
        capListenerHandle.remove();
      }
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }
}

export const navigationManager = new NavigationManager();
