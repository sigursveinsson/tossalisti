import React from 'react'

// Öryggisnet: hrun í einum glugga (Stjórnborð, Gríptu stig, kvittanaskanni…) sýnir skilaboð og loka-hnapp
// í stað þess að fella allt appið í hvítan skjá. Villan fer í console svo hægt sé að finna hana.
export default class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(error) { return { error } }
  componentDidCatch(error, info) { try { console.error('[Tossalisti] hrun í ' + (this.props.name || 'glugga'), error, info && info.componentStack) } catch {} }
  render() {
    if (!this.state.error) return this.props.children
    const msg = (this.state.error && (this.state.error.message || String(this.state.error))) || 'Óþekkt villa'
    return (
      <div className="sheet-bg center" onClick={this.props.onClose}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <h2>Eitthvað fór úrskeiðis</h2>
          <p className="muted-p">{this.props.name ? `${this.props.name} náði ekki að opnast.` : 'Glugginn náði ekki að opnast.'} Reyndu aftur, og ef þetta endurtekur sig sendu okkur skjáskot af þessu:</p>
          <pre className="eb-msg">{msg}</pre>
          <div className="bc-actions">
            <button className="ghost-btn" onClick={() => window.location.reload()}>Endurhlaða appið</button>
            {this.props.onClose && <button className="primary-btn" onClick={this.props.onClose}>Loka</button>}
          </div>
        </div>
      </div>
    )
  }
}
