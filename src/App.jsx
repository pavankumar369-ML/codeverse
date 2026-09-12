import Viewport from './components/Viewport.jsx'
import Controls from './components/Controls.jsx'
import EditorPane from './components/EditorPane.jsx'
import StatsPanel from './components/StatsPanel.jsx'

export default function App() {
  return (
    <div className="app">
      <header className="topbar">
        <h1>Codeverse 3D</h1>
        <p>Watch an algorithm run instead of reading about it.</p>
      </header>

      <main className="layout">
        <EditorPane />
        <section className="stage">
          <div className="stage__canvas">
            <Viewport />
          </div>
          <Controls />
        </section>
        <StatsPanel />
      </main>
    </div>
  )
}
