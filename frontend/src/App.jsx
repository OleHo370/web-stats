import { useState } from 'react'
import './App.css'

function App() {
  const [status, setStatus] = useState(null)

  const checkBackend = async () => {
    try {
      const response = await fetch('http://localhost:8000/health')
      const data = await response.json()
      setStatus(data.status)
    } catch (error) {
      setStatus('error')
    }
  }

  return (
    <div className="App">
      <h1>YouTube Watch Stats</h1>
      <button onClick = {checkBackend}> Check Backend </button>
      {status && <p>Backend status: {status}</p>}
    </div>
  )
}

export default App