import { useState } from 'react'
import MapView from './MapView'
import Overlay, { type OverlayFormData } from './Overlay'
import './App.css'
import { findPOIs, type POI, type POIQueryOptions } from './Query'
import { FILTERS } from './AmenityCategories'

function App() {
  const [isOverlayOpen, setIsOverlayOpen] = useState(true)
  const [isSearching,setIsSearching] = useState(false)
  const [userPosition, setUserPosition] = useState<GeolocationCoordinates | null>(null)
  const [pois,setPois] = useState<POI[]>([])

  const handleFormSubmit = async (data: OverlayFormData) => {
    if (!userPosition) {
      console.warn('No location available yet')
      alert("Position not available.")
      return
    }

    console.log('Submitting with location:', userPosition.latitude, userPosition.longitude, data)
    setIsSearching(true)

    const queryOptions:POIQueryOptions={
      lat:userPosition.latitude,
      lon:userPosition.longitude,
      distance:data.distance,
      filter:FILTERS[data.category]
    }

    let POIs:POI[] = []
    try {
      POIs = await findPOIs(queryOptions);
      setPois(POIs)
      console.log(`Found ${POIs.length} POIS`)
      if (POIs.length===0){
        alert("None within this distance.")
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error("Failed to fetch POIs:", error.message);
      } else {
        console.error("Unknown error fetching POIs:", error);
      }
      alert("Error")
    }
    finally{
      setIsSearching(false)
    }
  }


  return (
    <>
      <MapView pois={pois} onPositionUpdate={setUserPosition} />
      {!isOverlayOpen && <button
        onClick={() => setIsOverlayOpen(true)}
        style={{
          position: 'fixed',
          top: 16,
          right: 16,
          zIndex: 2,
          padding: '10px 16px',
          borderRadius: 8,
        }}
        className='btn'
      >
        New search
      </button>}
      {isSearching  && <img
      src={"spinner.svg"}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 1,
        mixBlendMode: 'multiply',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%) scale(1.5)', // 1.5x bigger
        pointerEvents: 'none',
      }}
    />}
      <Overlay isOpen={isOverlayOpen} onClose={() => setIsOverlayOpen(false)} onSubmit={handleFormSubmit} />
    </>
  )
}

export default App