import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

interface TurnstileAPI {
  render: (container: HTMLElement, options: {
    sitekey: string;
    callback: (token: string) => void;
    'expired-callback'?: () => void;
    'error-callback'?: () => void;
  }) => string;
  remove: (widgetId: string) => void;
  reset: (widgetId: string) => void;
}

export interface TurnstileWidgetHandle {
  reset: () => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileAPI;
  }
}

interface TurnstileWidgetProps {
  siteKey: string;
  onToken: (token: string) => void;
  onExpire?: () => void;
}

const TurnstileWidget = forwardRef<TurnstileWidgetHandle, TurnstileWidgetProps>(({ siteKey, onToken, onExpire }, fwdRef) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const widgetId = useRef<string | null>(null);
  // Keep latest callbacks in refs so the effect doesn't re-run on each render
  const onTokenRef = useRef(onToken);
  const onExpireRef = useRef(onExpire);
  useEffect(() => { onTokenRef.current = onToken; }, [onToken]);
  useEffect(() => { onExpireRef.current = onExpire; }, [onExpire]);

  useImperativeHandle(fwdRef, () => ({
    reset: () => {
      if (widgetId.current && window.turnstile && typeof window.turnstile.reset === 'function') {
        window.turnstile.reset(widgetId.current);
      }
    }
  }));

  useEffect(() => {
    const ensureScript = () => new Promise<void>((resolve) => {
      if (window.turnstile) return resolve();
      // Avoid duplicate script tags
      if (!document.querySelector('script[data-turnstile]')) {
        const s = document.createElement('script');
        s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        s.async = true;
        s.defer = true;
        s.setAttribute('data-turnstile', 'true');
        s.onload = () => resolve();
        document.body.appendChild(s);
        return;
      }
      resolve();
    });

    let mounted = true;
    (async () => {
      await ensureScript();
      if (!mounted) return;
      if (ref.current && window.turnstile) {
        // If a widget already exists for this ref, remove it first
        if (widgetId.current && typeof window.turnstile.remove === 'function') {
          try { window.turnstile.remove(widgetId.current); } catch { /* noop */ }
          widgetId.current = null;
        }
        widgetId.current = window.turnstile.render(ref.current, {
          sitekey: siteKey,
          callback: (token: string) => onTokenRef.current(token),
          'expired-callback': () => onExpireRef.current?.(),
          'error-callback': () => onExpireRef.current?.(),
        });
      }
    })();

    return () => {
      mounted = false;
      if (widgetId.current && window.turnstile && typeof window.turnstile.remove === 'function') {
        try { window.turnstile.remove(widgetId.current); } catch { /* noop */ }
        widgetId.current = null;
      }
    };
  }, [siteKey]);

  return <div ref={ref} />;
});

TurnstileWidget.displayName = 'TurnstileWidget';

export default TurnstileWidget;
