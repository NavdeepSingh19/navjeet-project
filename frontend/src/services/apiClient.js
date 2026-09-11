import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL || '/api'

const client = axios.create({ baseURL, timeout: 15000 })

client.interceptors.response.use(
  (response) => response,
  (err) => {
    let normalized
    if (err.response) {
      const data = err.response.data
      normalized = {
        message: data?.error || 'Something went wrong. Please try again.',
        code: data?.code || 'UNKNOWN_ERROR',
        status: err.response.status,
      }
    } else if (err.request) {
      normalized = { message: 'Failed to load data. Please try again.', code: 'NETWORK_ERROR', status: null }
    } else {
      normalized = { message: err.message, code: 'CLIENT_ERROR', status: null }
    }
    console.error('[apiClient]', normalized, err)
    return Promise.reject(normalized)
  },
)

export async function searchCities(query) {
  const { data } = await client.get('/cities/search', { params: { query } })
  return data
}

export async function getCityMetrics(cityName, bbox) {
  const params = {}
  if (bbox) {
    const [minLon, minLat, maxLon, maxLat] = bbox
    Object.assign(params, { min_lon: minLon, min_lat: minLat, max_lon: maxLon, max_lat: maxLat })
  }
  const { data } = await client.get(`/cities/${encodeURIComponent(cityName)}/accessibility-metrics`, { params })
  return data
}

export async function getCellDetails(cityName, h3Index) {
  const { data } = await client.get(`/cities/${encodeURIComponent(cityName)}/cell/${encodeURIComponent(h3Index)}`)
  return data
}

export default { searchCities, getCityMetrics, getCellDetails }
