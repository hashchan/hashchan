import { Component, type ReactNode } from 'react'

interface State { error: Error | null }

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: any) {
    console.error('[HashChan YT] render error:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: '10px', color: '#e33', fontSize: '0.8em', fontFamily: 'monospace' }}>
          <p style={{ fontWeight: 'bold' }}>Error</p>
          <p style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {this.state.error.message}
          </p>
        </div>
      )
    }
    return this.props.children
  }
}
