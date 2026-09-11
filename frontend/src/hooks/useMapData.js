import { useCallback, useRef, useState } from 'react'
import { getCityMetrics, searchCities as apiSearchCities } from '../services/apiClient'

export default function useMapData() {
  const [mapData, setMapData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [version, setVersion] = useState(0)
  const cityRef = useRef(null)

  const fetchCityData = useCallback(async (cityName) => {
    setLoading(true)
    setError(null)
    try {
      const data = await getCityMetrics(cityName)
      cityRef.current = cityName
      setMapData(data)
      setVersion((v) => v + 1)
      return data
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Silent viewport refinement on pan/zoom: keeps existing data visible on
  // failure instead of surfacing a full-page error for a background refresh.
  const fetchViewport = useCallback(async (bbox) => {
    if (!cityRef.current) return
    try {
      const data = await getCityMetrics(cityRef.current, bbox)
      setMapData((prev) => (prev ? { ...prev, features: data.features, metadata: data.metadata } : data))
      setVersion((v) => v + 1)
    } catch (err) {
      console.error('[useMapData] viewport refresh failed', err)
    }
  }, [])

  const searchCities = useCallback((query) => apiSearchCities(query), [])

  const retry = useCallback(() => {
    if (cityRef.current) return fetchCityData(cityRef.current)
    return Promise.resolve()
  }, [fetchCityData])

  return { mapData, loading, error, version, fetchCityData, fetchViewport, searchCities, retry }
}
