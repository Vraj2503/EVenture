"use client";

import { useState, useEffect } from "react";

interface ScooterFiltersProps {
  locations: string[];
  minPrice: number;
  maxPrice: number;
  maxSpeeds: string[];
  onFilterChange: (filters: FilterOptions) => void;
}

export interface FilterOptions {
  location: string;
  priceRange: [number, number];
  maxSpeed: string;
  availability: boolean;
}

export default function ScooterFilters({
  locations,
  minPrice,
  maxPrice,
  maxSpeeds,
  onFilterChange,
}: ScooterFiltersProps) {
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [priceRange, setPriceRange] = useState<[number, number]>([minPrice, maxPrice]);
  const [selectedMaxSpeed, setSelectedMaxSpeed] = useState<string>("");
  const [showOnlyAvailable, setShowOnlyAvailable] = useState<boolean>(false);

  useEffect(() => {
    // Update filters when props change
    setPriceRange([minPrice, maxPrice]);
  }, [minPrice, maxPrice]);

  const handleApplyFilters = () => {
    onFilterChange({
      location: selectedLocation,
      priceRange,
      maxSpeed: selectedMaxSpeed,
      availability: showOnlyAvailable,
    });
  };

  const handleResetFilters = () => {
    setSelectedLocation("");
    setPriceRange([minPrice, maxPrice]);
    setSelectedMaxSpeed("");
    setShowOnlyAvailable(false);
    
    onFilterChange({
      location: "",
      priceRange: [minPrice, maxPrice],
      maxSpeed: "",
      availability: false,
    });
  };

  // Handle minimum price change
  const handleMinPriceChange = (newMinPrice: number) => {
    // Ensure min price doesn't exceed max price
    const validMinPrice = Math.min(newMinPrice, priceRange[1]);
    setPriceRange([validMinPrice, priceRange[1]]);
  };

  // Handle maximum price change
  const handleMaxPriceChange = (newMaxPrice: number) => {
    // Ensure max price doesn't go below min price
    const validMaxPrice = Math.max(newMaxPrice, priceRange[0]);
    setPriceRange([priceRange[0], validMaxPrice]);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-5 h-full sticky top-4">
      <div className="mb-6">
        <h2 className="text-xl font-semibold border-b pb-3 mb-4">Filters</h2>
        
        <div className="space-y-5">
          {/* Location Filter */}
          <div className="mb-5">
            <label htmlFor="location-filter" className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <select
              id="location-filter"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-sm"
            >
              <option value="">All Locations</option>
              {locations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>

          {/* Price Range Filter */}
          <div className="mb-5">
            <div className="flex justify-between mb-2">
              <label htmlFor="price-range" className="block text-sm font-medium text-gray-700">
                Price Range
              </label>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">₹{priceRange[0]}</span>
              <span className="text-sm text-gray-600">₹{priceRange[1]}</span>
            </div>
            <div className="space-y-4">
              <input
                type="range"
                id="min-price"
                min={minPrice}
                max={maxPrice}
                value={priceRange[0]}
                onChange={(e) => handleMinPriceChange(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
              <input
                type="range"
                id="max-price"
                min={minPrice}
                max={maxPrice}
                value={priceRange[1]}
                onChange={(e) => handleMaxPriceChange(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
            </div>
          </div>

          {/* Max Speed Filter */}
          <div className="mb-5">
            <label htmlFor="speed-filter" className="block text-sm font-medium text-gray-700 mb-2">
              Max Speed
            </label>
            <select
              id="speed-filter"
              value={selectedMaxSpeed}
              onChange={(e) => setSelectedMaxSpeed(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-sm"
            >
              <option value="">All Speeds</option>
              {maxSpeeds.map((speed) => (
                <option key={speed} value={speed}>
                  {speed}
                </option>
              ))}
            </select>
          </div>

          {/* Availability Filter */}
          <div className="mb-5 flex items-center">
            <input
              id="available-filter"
              type="checkbox"
              checked={showOnlyAvailable}
              onChange={(e) => setShowOnlyAvailable(e.target.checked)}
              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
            />
            <label htmlFor="available-filter" className="ml-2 block text-sm text-gray-700">
              Show only available scooters
            </label>
          </div>
        </div>
      </div>

      {/* Filter Control Buttons */}
      <div className="space-y-3 border-t pt-4">
        <button
          onClick={handleApplyFilters}
          className="w-full bg-black text-white py-2 px-4 rounded-md hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 text-sm font-medium"
        >
          Apply Filters
        </button>
        <button
          onClick={handleResetFilters}
          className="w-full bg-gray-100 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 text-sm font-medium"
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
}