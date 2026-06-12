// Static imports of the shared data tables — airline-game/data is the single
// source of truth (CONTRACT §0); imported at build time, no runtime fetch.
import citiesJson from '../../../data/cities.json';
import aircraftJson from '../../../data/aircraft.json';
import aircraftImagesJson from '../../../data/aircraft-images.json';
import cityImagesJson from '../../../data/city-images.json';

import type { AircraftImageManifest, AircraftModel, City, CityImageManifest } from '@/types';

export type { CityImageEntry, CityImageManifest } from '@/types';

export const CITIES: City[] = citiesJson;

export const AIRCRAFT_MODELS: AircraftModel[] = aircraftJson;

// The manifest is populated by the parent session in parallel and may be {};
// every consumer must tolerate missing entries (silhouette fallback).
export const AIRCRAFT_IMAGES: AircraftImageManifest =
  aircraftImagesJson as AircraftImageManifest;

// city-images.json may be {} (created empty when the parallel agent hasn't run);
// consumers must tolerate missing entries and show a gradient placeholder.
export const CITY_IMAGES: CityImageManifest =
  cityImagesJson as CityImageManifest;

export const CITY_BY_ID: ReadonlyMap<string, City> = new Map(
  CITIES.map((city) => [city.id, city]),
);

export const MODEL_BY_ID: ReadonlyMap<string, AircraftModel> = new Map(
  AIRCRAFT_MODELS.map((model) => [model.id, model]),
);

export const cityLabel = (cityId: string): string => {
  const city = CITY_BY_ID.get(cityId);
  return city ? `${city.nameZh} ${city.name}` : cityId;
};

export const cityZh = (cityId: string): string => CITY_BY_ID.get(cityId)?.nameZh ?? cityId;

export const modelName = (modelId: string): string => {
  const model = MODEL_BY_ID.get(modelId);
  return model ? `${model.manufacturer} ${model.name}` : modelId;
};
