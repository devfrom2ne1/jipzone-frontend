export type ApartmentSearchResult = {
  id: string;
  name: string;
  address: string;
  longitude: string;
  latitude: string;
};

export type AddressSearchApiResult = {
  place_name?: string;
  placeName?: string;
  road_address_name?: string;
  roadAddressName?: string;
  address_name?: string;
  addressName?: string;
  address?: string;
  longitude: string | number;
  latitude: string | number;
};
