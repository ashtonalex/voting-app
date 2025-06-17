declare global {
  interface Window {
    turnstile: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string
          callback?: (token: string) => void
          "error-callback"?: () => void
          "expired-callback"?: () => void
          theme?: "light" | "dark" | "auto"
          size?: "normal" | "compact"
          retry?: "auto" | "never"
          "retry-interval"?: number
          "refresh-expired"?: "auto" | "manual" | "never"
          appearance?: "always" | "execute" | "interaction-only"
          execution?: "render" | "execute"
        },
      ) => string
      reset: (widgetId?: string) => void
      remove: (widgetId?: string) => void
      execute: (container?: string | HTMLElement, options?: object) => void
      getResponse: (widgetId?: string) => string
    }
  }
}

export {}
