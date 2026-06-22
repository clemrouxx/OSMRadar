import { FILTERS, type AmenityCategory } from "./AmenityCategories";

export interface POIQueryOptions {
  lat: number;
  lon: number;
  distance: number;
  category: AmenityCategory;
}

export interface POI {
  id: number;
  type: "node" | "way";
  category: AmenityCategory;
  lat: number;
  lon: number;
  tags: Record<string, string>;
}

interface OverpassElement {
  type: "node" | "way";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

const DEFAULT_OVERPASS_URL = "https://overpass-api.de/api/interpreter";

export async function findPOIs(opts: POIQueryOptions): Promise<POI[]> {
  const { lat, lon, distance, category } = opts;
  const filter = FILTERS[category];
  const around = `(around:${distance},${lat},${lon})`;

  const query = `
[out:json][timeout:25];
(
  node${filter}${around};
  way${filter}${around};
);
out center tags;
`.trim();

  const response = await fetch(DEFAULT_OVERPASS_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: query,
  });

  if (!response.ok) {
    throw new Error(`Overpass API request failed: ${response.status} ${response.statusText}`);
  }

  const data: { elements: OverpassElement[] } = await response.json();

  return data.elements.map((el) => ({
    id: el.id,
    type: el.type,
    lat: el.lat ?? el.center!.lat,
    lon: el.lon ?? el.center!.lon,
    tags: el.tags ?? {},
    category: category,
  }));
}