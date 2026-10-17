'use client'

import { useEffect, useState } from 'react'
import {
  CircleMarker,
  MapContainer,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet'

type Coordinates = [number, number]

type LocationPickerProps = {
  onLocationSelect: (
    latitude: number,
    longitude: number,
    address?: string
  ) => void
}

type GeocodeResult = {
  display_name?: string
}

const DEFAULT_POSITION: Coordinates = [18.5204, 73.8567]

function RecenterMap({ position }: { position: Coordinates }) {
  const map = useMap()

  useEffect(() => {
    map.setView(position, map.getZoom())
  }, [map, position])

  return null
}

function MapClickHandler({
  onSelect,
  setPosition,
}: {
  onSelect: (latitude: number, longitude: number) => void
  setPosition: (position: Coordinates) => void
}) {
  useMapEvents({
    click(event) {
      const latitude = event.latlng.lat
      const longitude = event.latlng.lng

      setPosition([latitude, longitude])
      onSelect(latitude, longitude)
    },
  })

  return null
}

export default function LocationPicker({
  onLocationSelect,
}: LocationPickerProps) {
  const [position, setPosition] =
    useState<Coordinates>(DEFAULT_POSITION)

  const [message, setMessage] = useState(
    'Use GPS or tap the map to select the issue location.'
  )

  async function resolveLocation(
    latitude: number,
    longitude: number
  ) {
    setPosition([latitude, longitude])
    setMessage('Looking up the nearest address...')

    try {
      const params = new URLSearchParams({
        format: 'jsonv2',
        lat: String(latitude),
        lon: String(longitude),
        zoom: '18',
        addressdetails: '1',
      })

      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?${params.toString()}`
      )

      if (!response.ok) {
        throw new Error('Address lookup failed.')
      }

      const result = (await response.json()) as GeocodeResult
      const address = result.display_name?.trim()

      onLocationSelect(latitude, longitude, address)

      setMessage(
        address
          ? 'Address found. You can adjust the pin on the map.'
          : 'Coordinates captured. You can adjust the pin on the map.'
      )
    } catch {
      onLocationSelect(latitude, longitude)
      setMessage(
        'Coordinates captured. Address lookup unavailable; coordinates are still available.'
      )
    }
  }

  function detectLocation() {
    if (!navigator.geolocation) {
      setMessage('GPS location is not supported by this browser.')
      return
    }

    setMessage('Finding your location...')

    navigator.geolocation.getCurrentPosition(
      (result) => {
        void resolveLocation(
          result.coords.latitude,
          result.coords.longitude
        )
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setMessage(
            'Location permission denied. Allow it in your browser settings.'
          )
        } else if (error.code === error.TIMEOUT) {
          setMessage('Location request timed out. Please try again.')
        } else {
          setMessage(
            'Could not detect your location. Try again or select the map manually.'
          )
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    )
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={detectLocation}
        className="rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white transition hover:bg-emerald-800"
      >
        📍 Use my current location
      </button>

      <p className="text-sm text-gray-600" aria-live="polite">
        {message}
      </p>

      <MapContainer
        center={DEFAULT_POSITION}
        zoom={13}
        scrollWheelZoom={true}
        className="civicfix-map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <RecenterMap position={position} />

        <MapClickHandler
          onSelect={(latitude, longitude) => {
            void resolveLocation(latitude, longitude)
          }}
          setPosition={setPosition}
        />

        <CircleMarker
          center={position}
          radius={9}
          pathOptions={{
            color: '#ffffff',
            weight: 3,
            fillColor: '#059669',
            fillOpacity: 1,
          }}
        />
      </MapContainer>

      <p className="text-xs text-gray-500">
        Select your location using GPS or tap the map. The coordinates
        are preserved even when an address cannot be found.
      </p>
    </div>
  )
}