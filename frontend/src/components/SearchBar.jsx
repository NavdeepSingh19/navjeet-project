import { useEffect, useRef, useState } from 'react'
import { Loader2, MapPin, Search } from 'lucide-react'

const DEBOUNCE_MS = 300

export default function SearchBar({ onSearch, onSelectCity, disabled }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState(null)
  const debounceRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setResults([])
      setIsOpen(false)
      setSearchError(trimmed.length === 1 ? 'Search requires at least 2 characters' : null)
      return undefined
    }

    setSearchError(null)
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true)
      try {
        const cities = await onSearch(trimmed)
        setResults(cities)
        setIsOpen(true)
      } catch (err) {
        setSearchError(err.message || 'Search failed')
        setResults([])
      } finally {
        setIsSearching(false)
      }
    }, DEBOUNCE_MS)

    return () => clearTimeout(debounceRef.current)
  }, [query, onSearch])

  function handleSelect(city) {
    onSelectCity(city)
    setQuery('')
    setResults([])
    setIsOpen(false)
  }

  return (
    <div className="search-bar" ref={containerRef}>
      <label htmlFor="city-search" className="sr-only">Search cities</label>
      <div className="search-input-wrap">
        <Search size={16} className="search-icon" aria-hidden="true" />
        <input
          id="city-search"
          type="text"
          value={query}
          disabled={disabled}
          placeholder="Search cities (e.g. Amritsar)..."
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          autoComplete="off"
        />
        {isSearching && <Loader2 size={16} className="spin-icon" aria-hidden="true" />}
      </div>

      {searchError && <p className="search-error" role="alert">{searchError}</p>}

      {isOpen && results.length > 0 && (
        <ul className="search-results" role="listbox">
          {results.map((city) => (
            <li key={`${city.name}-${city.state}`}>
              <button type="button" role="option" onClick={() => handleSelect(city)}>
                <MapPin size={14} aria-hidden="true" />
                <span className="search-result-text">
                  <strong>{city.name}</strong>, {city.state}
                  <small> · {city.population?.toLocaleString()} people</small>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {isOpen && !isSearching && results.length === 0 && query.trim().length >= 2 && !searchError && (
        <p className="search-empty">No city found. Try searching Amritsar, Punjab</p>
      )}
    </div>
  )
}
