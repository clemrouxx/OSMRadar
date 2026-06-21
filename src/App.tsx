import { useState } from 'react'
import MapView from './MapView'
import Overlay, { type OverlayFormData } from './Overlay'
import './App.css'
import { findPOIs, type POI, type POIQueryOptions } from './Query'

function App() {
  const [isOverlayOpen, setIsOverlayOpen] = useState(false)
  const [userPosition, setUserPosition] = useState<GeolocationCoordinates | null>(null)
  const [pois,setPois] = useState<POI[]>([])

  const handleFormSubmit = async (data: OverlayFormData) => {
    if (!userPosition) {
      console.warn('No location available yet')
      alert("Position not available.")
      return
    }

    console.log('Submitting with location:', userPosition.latitude, userPosition.longitude, data)

    const queryOptions:POIQueryOptions={
      lat:userPosition.latitude,
      lon:userPosition.longitude,
      distance:data.distance,
      tagKey:"building",
      tagValue:"yes",
    }
    const POIs = await findPOIs(queryOptions)
    setPois(POIs)
  }


  return (
    <>
      <MapView pois={pois} onPositionUpdate={setUserPosition} />
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
      <Overlay isOpen={isOverlayOpen} onClose={() => setIsOverlayOpen(false)} onSubmit={handleFormSubmit} />
    </>
  )
}

export default App