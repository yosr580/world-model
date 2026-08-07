import { Link } from 'react-router-dom'

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/90 bg-slate-950/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 text-slate-100">
        <Link to="/" className="text-lg font-semibold text-cyan-300 hover:text-cyan-200">
          World Models
        </Link>
        <nav className="flex items-center gap-4 text-sm text-slate-300">
          <Link to="/" className="transition hover:text-cyan-200">
            Accueil
          </Link>
          <Link to="/encyclopedia" className="transition hover:text-cyan-200">
            Encyclopédie
          </Link>
          <a
            href="https://github.com/yosr580/world-model"
            target="_blank"
            rel="noreferrer"
            className="transition hover:text-cyan-200"
          >
            GitHub
          </a>
        </nav>
      </div>
    </header>
  )
}
