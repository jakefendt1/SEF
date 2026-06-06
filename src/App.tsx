import intraloxLogo from './assets/intralox-logo.svg'
import { FormView } from './components/FormView'

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-900 text-white px-4 py-3 flex items-center gap-4 sticky top-0 z-20">
        <img src={intraloxLogo} alt="Intralox" className="h-10 w-auto" />
        <div>
          <h1 className="text-xl font-bold tracking-tight leading-none">Spiral Eval</h1>
          <p className="text-blue-200 text-xs mt-0.5">Field Assessment</p>
        </div>
      </header>
      <main className="bg-gray-50">
        <FormView />
      </main>
    </div>
  )
}
