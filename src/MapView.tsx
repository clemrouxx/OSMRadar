import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

type DeviceOrientationEventiOS = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<'granted' | 'denied'>
}

function MapView() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const arrowRef = useRef<HTMLDivElement | null>(null)
  const handleOrientationRef = useRef<(event: DeviceOrientationEvent) => void>(() => {})
  const [needsCompassPermission, setNeedsCompassPermission] = useState(false)

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: [2, 48],
      zoom: 13,
    })
    mapRef.current = map

    const geolocate = new maplibregl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
      showAccuracyCircle: true,
    })
    map.addControl(geolocate)
    map.on('load', () => geolocate.trigger())

    // Heading arrow, drawn manually — maplibre has no built-in heading cone
    const arrowEl = document.createElement('div')
    arrowEl.style.width = '28px'
    arrowEl.style.height = '28px'
    arrowEl.style.transformOrigin = '50% 50%'
    arrowEl.innerHTML = `<svg width="28" height="28" viewBox="0 0 32 32">
      <polygon points="16,2 24,28 16,22 8,28" fill="#1a73e8" stroke="white" stroke-width="1.5" />
    </svg>`
    arrowRef.current = arrowEl
    const headingMarker = new maplibregl.Marker({ element: arrowEl })

    geolocate.on('geolocate', (position: GeolocationPosition) => {
      headingMarker.setLngLat([position.coords.longitude, position.coords.latitude]).addTo(map)
    })

    const handleOrientation = (event: DeviceOrientationEvent) => {
      const iosHeading = (event as DeviceOrientationEvent & { webkitCompassHeading?: number }).webkitCompassHeading
      const heading = iosHeading ?? (event.alpha != null ? 360 - event.alpha : null)
      if (heading != null && arrowRef.current) {
        arrowRef.current.style.transform = `rotate(${heading}deg)`
      }
    }
    handleOrientationRef.current = handleOrientation

    const DOE = DeviceOrientationEvent as DeviceOrientationEventiOS
    if (typeof DOE?.requestPermission === 'function') {
      setNeedsCompassPermission(true)
    } else {
      window.addEventListener('deviceorientationabsolute', handleOrientation)
      window.addEventListener('deviceorientation', handleOrientation)
    }

    return () => {
      window.removeEventListener('deviceorientationabsolute', handleOrientation)
      window.removeEventListener('deviceorientation', handleOrientation)
      map.remove()
      mapRef.current = null
    }
  }, [])

  const enableCompass = async () => {
    const DOE = DeviceOrientationEvent as DeviceOrientationEventiOS
    const result = await DOE.requestPermission?.()
    if (result === 'granted') {
      window.addEventListener('deviceorientation', handleOrientationRef.current)
      setNeedsCompassPermission(false)
    }
  }

  return (
    <>
      <div ref={mapContainer} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }} />
      {needsCompassPermission && (
        <button
          onClick={enableCompass}
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1,
            padding: '10px 16px',
            borderRadius: 8,
          }}
        >
          Enable compass
        </button>
      )}
    </>
  )
}

export default MapView