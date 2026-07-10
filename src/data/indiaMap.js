import indiaStatesSvg from "../assets/maps/india-states.svg?raw"

export const MAP_VIEWBOX = { width: 612, height: 696 }

const GEO_BOUNDS = {
  minLng: 68.0,
  maxLng: 97.5,
  minLat: 6.5,
  maxLat: 37.5,
}

export function latLngToMapSvg(lat, lng) {
  const x =
    ((lng - GEO_BOUNDS.minLng) / (GEO_BOUNDS.maxLng - GEO_BOUNDS.minLng)) *
    MAP_VIEWBOX.width
  const y =
    ((GEO_BOUNDS.maxLat - lat) / (GEO_BOUNDS.maxLat - GEO_BOUNDS.minLat)) *
    MAP_VIEWBOX.height
  return { x, y }
}

let cachedPaths = null

export function getIndiaStatePaths() {
  if (cachedPaths) return cachedPaths

  const doc = new DOMParser().parseFromString(indiaStatesSvg, "image/svg+xml")
  cachedPaths = Array.from(doc.querySelectorAll("path")).map((path) => ({
    id: path.getAttribute("id"),
    label: path.getAttribute("aria-label"),
    d: path.getAttribute("d"),
  }))

  return cachedPaths
}
