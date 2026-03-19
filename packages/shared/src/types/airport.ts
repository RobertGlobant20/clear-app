export interface Airport {
  id: number;
  ident: string;
  type: string;
  name: string;
  latitude: number;
  longitude: number;
  elevationFt: number | null;
  continent: string;
  isoCountry: string;
  isoRegion: string;
  municipality: string;
  iataCode: string | null;
  icaoCode: string | null;
}

export interface AirportSearchResult {
  iataCode: string;
  icaoCode: string;
  name: string;
  municipality: string;
  country: string;
  latitude: number;
  longitude: number;
}
