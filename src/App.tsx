import { useRef, useState } from 'react'
import MapView, { type MapViewRef } from './MapView'
import Overlay, { type OverlayFormData } from './Overlay'
import './App.css'
import { findPOIs, type POI, type POIQueryOptions } from './Query'

function App() {
  const [isOverlayOpen, setIsOverlayOpen] = useState(true)
  const [isSearching,setIsSearching] = useState(false)
  const [userPosition, setUserPosition] = useState<GeolocationCoordinates | null>(null)
  const [pois,setPois] = useState<POI[]>([])
  const mapViewRef = useRef<MapViewRef>(null);

  const handleFormSubmit = async (data: OverlayFormData) => {
    if (!userPosition) {
      console.warn('No location available yet')
      alert("Position not available.")
      return
    }

    setIsSearching(true)

    const queryOptions:POIQueryOptions={
      lat:userPosition.latitude,
      lon:userPosition.longitude,
      distance:data.distance,
      category:data.category
    }
    mapViewRef.current?.fitTarget([queryOptions.lon,queryOptions.lat],queryOptions.distance)

    let POIs:POI[] = []
    try {
      POIs = await findPOIs(queryOptions);
      setPois(POIs)
      if (POIs.length===0){
        alert("Sorry, none were found.")
      }
    } catch (error) {
      if (error instanceof Error) {
        
        console.error("Failed to fetch POIs:", error);
        alert(`Sorry, something went wrong: ${error.message}`)
      } else {
        console.error("Unknown error fetching POIs:", error);
        alert("Sorry, something went wrong.")
      }
    }
    finally{
      setIsSearching(false)
    }
  }

  return (
    <>
      <MapView pois={pois} onPositionUpdate={setUserPosition} ref={mapViewRef} />
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
      {isSearching && <div
        style={{position: "fixed",inset: 0,display: "flex",justifyContent: "center",alignItems: "center",overflow: "hidden",}}>
        <img
          src={"spinner.svg"}
          alt=""
          style={{width: "100vw",height: "100vh",objectFit: "contain",display: "block",}}
        />
      </div>}
      <Overlay isOpen={isOverlayOpen} onClose={() => setIsOverlayOpen(false)} onSubmit={handleFormSubmit} />
    </>
  )
}

export default App