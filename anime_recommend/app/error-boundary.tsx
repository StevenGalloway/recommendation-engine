"use client";

import React from "react";

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary] Unhandled render error", {
      error: error.message,
      stack: error.stack,
      componentStack: info.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            backgroundColor: "#0A0F1E",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "#E2E8F0",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>⚠️</p>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>
            Something went wrong
          </h2>
          <p style={{ color: "#64748B", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
            {this.state.message || "An unexpected error occurred."}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: "linear-gradient(135deg, #6366F1, #4338CA)",
              color: "white",
              border: "none",
              borderRadius: 999,
              padding: "0.6rem 2rem",
              fontWeight: 600,
              fontSize: "0.9rem",
              cursor: "pointer",
            }}
          >
            Reload page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
