import { useState, type SubmitEvent } from 'react'
import { amenityOptions, type AmenityCategory } from './AmenityCategories'

interface OverlayFormData {
  category: string
  distance: number
}

interface OverlayProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: OverlayFormData) => void
}

function Overlay({ isOpen, onClose, onSubmit }: OverlayProps) {
  const [category, setCategory] = useState(amenityOptions[0])
  const [distance, setDistance] = useState(200)

  if (!isOpen) return null

  const handleSubmit = (e: SubmitEvent) => {
    e.preventDefault()
    onSubmit({ category, distance })
    onClose()
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10,
        background: 'rgba(255, 255, 255, 0.8)',
        display: 'flex',
        flexDirection: 'column',
        padding: 24,
        overflowY: 'auto',
      }}
    >
      <button onClick={onClose} style={{ alignSelf: 'flex-end', marginBottom: 16 }}>
        Close
      </button>

      <form onSubmit={handleSubmit}>
        <label style={{ display: 'block', marginBottom: 16 }}>
          Looking for:
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as AmenityCategory)}
            style={{ display: 'block', width: '100%', marginTop: 4 }}
          >
            {amenityOptions.map((option) => (
            <option key={option} value={option}>
                {option}
            </option>
            ))}
          </select>
        </label>

        <label style={{ display: 'block', marginBottom: 16 }}>
          Within {distance} m
          <input
            type="range"
            min={100}
            max={2000}
            step={100}
            value={distance}
            onChange={(e) => setDistance(Number(e.target.value))}
            style={{ display: 'block', width: '100%', marginTop: 4 }}
          />
        </label>

        <button type="submit" className='submit'>Submit</button>
      </form>
    </div>
  )
}

export default Overlay