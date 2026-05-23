"use client"

import { Component, type ReactNode } from "react"

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  message: string
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, message: "" }
  }

  static getDerivedStateFromError(error: unknown): State {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : "Erro desconhecido.",
    }
  }

  override componentDidCatch(error: unknown, info: unknown) {
    console.error("ErrorBoundary caught:", error, info)
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ maxWidth: 480, width: "100%", padding: 32, background: "var(--bg-card)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 12 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#f87171", marginBottom: 10 }}>
              Erro inesperado
            </p>
            <p style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>
              Algo deu errado
            </p>
            <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 20 }}>
              {this.state.message}
            </p>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, message: "" })}
              style={{
                padding: "10px 20px", borderRadius: 8, cursor: "pointer",
                background: "var(--blue)", color: "#fff", border: "none",
                fontSize: 13, fontWeight: 700,
              }}
            >
              Tentar novamente
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
