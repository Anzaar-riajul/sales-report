import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    this.setState({ info });
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh', background: '#F8FAFC', display: 'flex',
          alignItems: 'center', justifyContent: 'center', padding: 24
        }}>
          <div style={{
            background: 'white', borderRadius: 16, padding: 32, maxWidth: 600, width: '100%',
            border: '1px solid #E2E8F0', boxShadow: '0 4px 24px rgba(0,0,0,0.06)'
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12, background: '#FEF2F2',
              border: '1px solid #FECACA', display: 'flex', alignItems: 'center',
              justifyContent: 'center', marginBottom: 16
            }}>
              <span style={{ fontSize: 24, color: '#DC2626' }}>!</span>
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#0F172A', marginBottom: 8 }}>
              Something went wrong
            </h2>
            <p style={{ fontSize: 13, color: '#64748B', fontFamily: 'monospace', marginBottom: 12 }}>
              {this.state.error?.message || 'Unknown error'}
            </p>
            <pre style={{
              fontSize: 11, color: '#475569', background: '#F1F5F9', padding: 12,
              borderRadius: 8, overflow: 'auto', maxHeight: 300, fontFamily: 'monospace',
              whiteSpace: 'pre-wrap', wordBreak: 'break-all'
            }}>
              {this.state.error?.stack || ''}
            </pre>
            <button onClick={() => window.location.reload()}
              style={{
                marginTop: 16, padding: '8px 20px', background: '#C9A84C', color: 'white',
                border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer'
              }}>
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
