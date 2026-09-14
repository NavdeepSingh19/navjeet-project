import { useEffect, useState } from 'react'
import { listCities } from '../services/apiClient'

export default function CitySelector({ currentCity, onSelectCity, disabled }) {
  const [cities, setCities] = useState([])

  useEffect(() => {
    let cancelled = false
    listCities()
      .then((data) => {
        if (!cancelled) setCities(data)
      })
      .catch((err) => console.error('[CitySelector] failed to load city list', err))
    return () => {
      cancelled = true
    }
  }, [])

  if (cities.length === 0) return null

  return (
    <nav className="city-chips" aria-label="Quick city switcher">
      {cities.map((city) => (
        <button
          key={city.name}
          type="button"
          className={city.name === currentCity ? 'city-chip active' : 'city-chip'}
          onClick={() => onSelectCity(city)}
          disabled={disabled}
          aria-pressed={city.name === currentCity}
        >
          {city.name}
        </button>
      ))}
    </nav>
  )
}
