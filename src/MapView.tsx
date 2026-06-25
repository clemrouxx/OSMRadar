import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import maplibregl, { type LngLatBoundsLike } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { POI } from './Query'
import type { AmenityCategory } from './AmenityCategories'

type DeviceOrientationEventiOS = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<'granted' | 'denied'>
}

interface MarkerOptions{
  color:string,html:string
}

const DEFAULT_COLOR = '#52eb23'
const VARIANT_COLOR = '#bb16ad'
const VARIANT_COLOR_2 = '#1394c7'
const NO_ACCESS_COLOR = '#977fa0'
const YES_COLOR = '#249b00'

function tagsToMarker(category:AmenityCategory,tags:Record<string,string>):MarkerOptions{
  let color = DEFAULT_COLOR
  let lines:string[] = []
  switch(category){
    case "TOILET":
      if ("access" in tags){
        lines.push(`Access: ${tags["access"]}`)
        if (tags.access==="no") color=NO_ACCESS_COLOR
      }
      if ("fee" in tags){
        lines.push(`Fee: ${tags["fee"]}`)
        if (tags.access==="yes" && tags.fee==="no") color=YES_COLOR
      }
      break
    case "ATM":
      if ("operator" in tags){
        lines.push(`Operator: ${tags["operator"]}`)
      }
      break
    case "DEFIBRILLATOR":
      if ("indoor" in tags){
        console.log("indoor =", tags.indoor);
        lines.push(tags.indoor==="yes"?"Indoor":"Outdoor")
        color = tags.indoor==="yes"?VARIANT_COLOR:VARIANT_COLOR_2
      }
      if ("level" in tags){
        lines.push(`Level: ${tags["level"]}`)
      }
      if ("access" in tags){
        lines.push(`Access: ${tags["access"]}`)
      }
      break
  }
  return {color,html:lines.join("<br/>")}
}

export type MapViewRef = {
  fitTarget: (
    center: [number,number], // [lng,lat]
    radius:number,
  ) => void;
};

function fitRadius(
  map: maplibregl.Map,
  center: [number, number], // [lng, lat]
  radiusMeters: number
) {
  const [lng, lat] = center;

  // Approximate conversion meters -> degrees
  const latDelta = radiusMeters / 111_320;
  const lngDelta =
    radiusMeters / (111_320 * Math.cos(lat * Math.PI / 180));

  const bounds: LngLatBoundsLike = [
    [lng - lngDelta, lat - latDelta],
    [lng + lngDelta, lat + latDelta],
  ];

  map.fitBounds(bounds, {
    padding: 20,
    animate: false,
  });
}

interface MapViewProps {
  pois: POI[],
  onPositionUpdate?: (coords: GeolocationCoordinates) => void,
}

export const MapView = forwardRef<MapViewRef,MapViewProps>(({ pois, onPositionUpdate },ref)=> {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const poiMarkersRef = useRef<Map<number, maplibregl.Marker>>(new Map())
  const arrowRef = useRef<HTMLDivElement | null>(null)
  const handleOrientationRef = useRef<(event: DeviceOrientationEvent) => void>(() => {})
  const [needsCompassPermission, setNeedsCompassPermission] = useState(false)

  useImperativeHandle(ref, () => ({
    fitTarget(center, radius) {
      if (mapRef.current) fitRadius(mapRef.current,center,radius)
    },
  }));

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: [0,40],
      zoom: 3,
    })
    mapRef.current = map

    const geolocate = new maplibregl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
      showAccuracyCircle: true,
    })
    map.addControl(geolocate,"top-left")
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
        onPositionUpdate?.(position.coords)
    })

    const handleOrientation = (event: DeviceOrientationEvent) => {
      const iosHeading = (event as DeviceOrientationEvent & { webkitCompassHeading?: number }).webkitCompassHeading
      const heading = iosHeading ?? (event.alpha != null ? 360 - event.alpha : null)
      if (heading != null && arrowRef.current) {
        const firstChild = arrowRef.current?.children[0];
        if (firstChild instanceof SVGElement) {
          firstChild.style.transform = `rotate(${heading}deg)`;
        }
      }
      else{
        console.warn("No defined heading")
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
      poiMarkersRef.current.forEach((marker) => marker.remove())
      poiMarkersRef.current.clear()
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const markers = poiMarkersRef.current
    const currentIds = new Set(pois.map((poi) => poi.id))

    // remove markers that no longer exist in the list
    for (const [id, marker] of markers) {
      if (!currentIds.has(id)) {
        marker.remove()
        markers.delete(id)
      }
    }

    // add new markers, or update positions of existing ones
    for (const poi of pois) {
      const existing = markers.get(poi.id)
      if (existing) {
        existing.setLngLat([poi.lon, poi.lat])
      } else {
        const markerOptions = tagsToMarker(poi.category,poi.tags)
        const marker = new maplibregl.Marker({ color:markerOptions.color })
          .setLngLat([poi.lon, poi.lat])
          .addTo(map)
          
        if (markerOptions.html !== "") {
          marker.setPopup(new maplibregl.Popup().setHTML(markerOptions.html))
        }

        markers.set(poi.id, marker)
      }
    }
  }, [pois])


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
});

export default MapView