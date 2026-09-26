import { useState } from 'react'
import './App.css'
import { increment } from './counter'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <h1><%= it.name %></h1>
      </div>
      <div className="card">
        <button onClick={() => setCount(increment)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
