import { useState } from 'react'
import MapView from './MapView'
import Overlay from './Overlay'
import './App.css'

function App() {
  const [isOverlayOpen, setIsOverlayOpen] = useState(false)

  return (
    <>
      <MapView />
      <button
        onClick={() => setIsOverlayOpen(true)}
        style={{
          position: 'fixed',
          top: 16,
          right: 16,
          zIndex: 2,
          padding: '10px 16px',
          borderRadius: 8,
        }}
      >
        Open form
      </button>
      <Overlay isOpen={isOverlayOpen} onClose={() => setIsOverlayOpen(false)} onSubmit={console.log} />
    </>
  )
}

export default App