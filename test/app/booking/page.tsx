// app/booking/page.tsx
"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "../components/ProtectedRoute";
import Link from "next/link";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import BookingModal, { BookingFormData } from "../components/BookingModal";
import ScooterFilters, { FilterOptions } from "../components/ScooterFilters";

// Define the EV scooter type
interface EVScooter {
  id: string;
  name: string;
  model: string;
  imageurl: string;
  priceperhour: number;
  maxspeed: string;
  location: string;
  mileage: string;
  support: string;
  owner: string;
  available: number;
  rating: number;
}

// Define the booking type
interface Booking {
  id?: string;
  booking_reference: string;
  user_id: string;
  scooter_id: string;
  pickup_date: string;
  pickup_time: string;
  dropoff_date: string;
  dropoff_time: string;
  pickup_location: string;
  dropoff_location: string;
  total_amount: number;
  total_hours: number;
  payment_id: string;
  order_id?: string;
  payment_signature?: string;
  booking_status: 'pending' | 'confirmed' | 'cancelled';
  created_at?: string;
  updated_at?: string;
}

export default function BookingPage() {
  const [evScooters, setEvScooters] = useState<EVScooter[]>([]);
  const [allScooters, setAllScooters] = useState<EVScooter[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedScooter, setSelectedScooter] = useState<EVScooter | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  
  // Filter state
  const [locations, setLocations] = useState<string[]>([]);
  const [maxSpeeds, setMaxSpeeds] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(200);
  const [activeFilters, setActiveFilters] = useState<FilterOptions | null>(null);
  
  const supabase = createClientComponentClient();
  const router = useRouter();

  // Fetch user data and EV scooters
  useEffect(() => {
    const fetchUserAndScooters = async () => {
      setLoading(true);
      
      try {
        // Get the current user
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          // User not authenticated, will be handled by ProtectedRoute
          return;
        }
        
        // Fetch scooters from Supabase
        const { data: scootersData, error } = await supabase
          .from('scooters')
          .select('*');
        
        if (error) {
          console.error('Error fetching scooters:', error);
          throw error;
        }
        
        if (scootersData) {
          const scooters = scootersData as EVScooter[];
          setEvScooters(scooters);
          setAllScooters(scooters);
          
          // Extract unique locations
          const uniqueLocations = Array.from(new Set(scooters.map(scooter => scooter.location)));
          setLocations(uniqueLocations);
          
          // Extract unique max speeds
          const uniqueMaxSpeeds = Array.from(new Set(scooters.map(scooter => scooter.maxspeed)));
          setMaxSpeeds(uniqueMaxSpeeds);
          
          // Find min and max prices
          const prices = scooters.map(scooter => scooter.priceperhour);
          setMinPrice(Math.min(...prices));
          setMaxPrice(Math.max(...prices));
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserAndScooters();
  }, [supabase]);

  const handleFilterChange = (filters: FilterOptions) => {
    setActiveFilters(filters);
    
    let filteredScooters = [...allScooters];
    
    // Filter by location
    if (filters.location) {
      filteredScooters = filteredScooters.filter(
        scooter => scooter.location === filters.location
      );
    }
    
    // Filter by price range
    filteredScooters = filteredScooters.filter(
      scooter => 
        scooter.priceperhour >= filters.priceRange[0] && 
        scooter.priceperhour <= filters.priceRange[1]
    );
    
    // Filter by max speed
    if (filters.maxSpeed) {
      filteredScooters = filteredScooters.filter(
        scooter => scooter.maxspeed === filters.maxSpeed
      );
    }
    
    // Filter by availability
    if (filters.availability) {
      filteredScooters = filteredScooters.filter(
        scooter => scooter.available > 0
      );
    }
    
    setEvScooters(filteredScooters);
  };

  const handleBookingClick = (scooter: EVScooter) => {
    if (scooter.available > 0) {
      setSelectedScooter(scooter);
      setShowBookingModal(true);
    }
  };

  const handleCloseModal = () => {
    setShowBookingModal(false);
    setSelectedScooter(null);
  };

  const handleBookingSubmit = async (bookingData: BookingFormData) => {
    try {
      // Get the current session to ensure we have the latest user ID
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session || !selectedScooter) {
        throw new Error('No active session or selected scooter');
      }
      
      // Create a new booking record in the database using session.user.id
      const newBooking: Booking = {
        user_id: session.user.id,
        booking_reference: `BK-${Date.now().toString(36).toUpperCase()}`,
        scooter_id: selectedScooter.id,
        pickup_date: bookingData.pickupDate,
        pickup_time: bookingData.pickupTime,
        dropoff_date: bookingData.dropoffDate,
        dropoff_time: bookingData.dropoffTime,
        pickup_location: bookingData.pickupLocation,
        dropoff_location: bookingData.dropoffLocation,
        payment_id: bookingData.paymentId,
        total_amount: bookingData.totalAmount,
        total_hours: bookingData.totalHours,
        booking_status: 'pending',
        created_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('bookings')
        .insert(newBooking)
        .select();
      
      if (error) {
        console.error('Error creating booking:', error);
        throw error;
      }
      
      // Update the available count for the selected scooter
      const { error: updateError } = await supabase
        .from('scooters')
        .update({ available: selectedScooter.available - 1 })
        .eq('id', selectedScooter.id);
      
      if (updateError) {
        console.error('Error updating scooter availability:', updateError);
        throw updateError;
      }
      
      // Update both scooter states
      const updateScooterState = (scooters: EVScooter[]) => 
        scooters.map(scooter => 
          scooter.id === selectedScooter.id 
            ? { ...scooter, available: scooter.available - 1 }
            : scooter
        );
      
      setEvScooters(updateScooterState);
      setAllScooters(updateScooterState);
      
      alert(`Booking request submitted for ${selectedScooter.name}! A station master will confirm your booking shortly.`);
      setShowBookingModal(false);
      setSelectedScooter(null);
      
    } catch (error) {
      console.error('Booking failed:', error);
      alert('Booking failed. Please try again later.');
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100">
      <header className="bg-black text-white p-6">
          <div className="container mx-auto flex justify-between items-center">
            <Link href="/">
              <div className="flex items-center cursor-pointer">
                <img 
                  src="/download.svg" 
                  alt="EVenture Logo" 
                  className="h-8 w-8"
                />
                <span className="ml-2 text-2xl font-light">EVenture</span>
              </div>
            </Link>
            
            <nav>
              <ul className="flex space-x-6">
                <li><Link href="/" className="hover:text-gray-300">Home</Link></li>
                <li><Link href="/services" className="hover:text-gray-300">Services</Link></li>
                <li><Link href="/about" className="hover:text-gray-300">About Us</Link></li>
                <li><Link href="/dashboard" className="hover:text-gray-300">Dashboard</Link></li>
                <li><Link href="/contact" className="hover:text-gray-300">Contact</Link></li>
              </ul>
            </nav>
          </div>
        </header>
        
        <main className="container mx-auto py-10 px-4">
          <h1 className="text-3xl font-bold mb-8">Book Your EV Scooter</h1>
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <p className="text-xl font-semibold mb-2">Loading available scooters...</p>
                <p>Please wait while we fetch the latest availability.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Display active filters at the top */}
              {activeFilters && (
                <div className="bg-gray-100 p-4 rounded-lg mb-6 flex flex-wrap gap-2">
                  <span className="font-semibold">Active Filters:</span>
                  {activeFilters.location && (
                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-sm">
                      Location: {activeFilters.location}
                    </span>
                  )}
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-sm">
                    Price: ₹{activeFilters.priceRange[0]} - ₹{activeFilters.priceRange[1]}/hr
                  </span>
                  {activeFilters.maxSpeed && (
                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-sm">
                      Max Speed: {activeFilters.maxSpeed}
                    </span>
                  )}
                  {activeFilters.availability && (
                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-sm">
                      Available Only
                    </span>
                  )}
                </div>
              )}
              
              <div className="flex flex-col md:flex-row gap-6">
                {/* Left sidebar with filters */}
                <div className="md:w-1/4 lg:w-1/5">
                  <ScooterFilters 
                    locations={locations}
                    minPrice={minPrice}
                    maxPrice={maxPrice}
                    maxSpeeds={maxSpeeds}
                    onFilterChange={handleFilterChange}
                  />
                </div>
                
                {/* Right side with scooter listings */}
                <div className="md:w-3/4 lg:w-4/5">
                  {evScooters.length === 0 ? (
                    <div className="bg-white p-6 rounded-lg shadow-md text-center">
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="h-16 w-16 mx-auto text-gray-400 mb-4" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                        />
                      </svg>
                      <p className="text-xl font-semibold mb-2">No scooters match your filter criteria</p>
                      <p className="text-gray-600 mb-4">Try adjusting your filters to see more options</p>
                      <button 
                        onClick={() => {
                          if (activeFilters) {
                            handleFilterChange({
                              location: "",
                              priceRange: [minPrice, maxPrice],
                              maxSpeed: "",
                              availability: false,
                            });
                          }
                        }}
                        className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-center mb-4">
                        <p className="text-gray-700">Showing {evScooters.length} of {allScooters.length} scooters</p>
                        <div className="flex items-center">
                          <span className="mr-2">Sort by:</span>
                          <select 
                            className="border rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-purple-500"
                            onChange={(e) => {
                              const sortBy = e.target.value;
                              const sorted = [...evScooters];
                              
                              if (sortBy === 'price-low') {
                                sorted.sort((a, b) => a.priceperhour - b.priceperhour);
                              } else if (sortBy === 'price-high') {
                                sorted.sort((a, b) => b.priceperhour - a.priceperhour);
                              } else if (sortBy === 'rating') {
                                sorted.sort((a, b) => b.rating - a.rating);
                              }
                              
                              setEvScooters(sorted);
                            }}
                          >
                            <option value="">Relevance</option>
                            <option value="price-low">Price: Low to High</option>
                            <option value="price-high">Price: High to Low</option>
                            <option value="rating">Highest Rated</option>
                          </select>
                        </div>
                      </div>
                    
                      <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {/* Keep the scooter card mapping the same */}
                        {evScooters.map((scooter) => (
                          <div 
                            key={scooter.id} 
                            className="bg-white rounded-lg shadow-md overflow-hidden"
                          >
                            {/* Keep the scooter card content the same */}
                            <div className="relative h-60 bg-white">
                              <div className={`absolute top-2 right-2 z-10 py-1 px-3 rounded-full text-white ${scooter.available > 0 ? 'bg-green-500' : 'bg-red-500'}`}>
                                {scooter.available > 0 ? 'Available' : 'Unavailable'}
                              </div>
                              <img 
                                src={scooter.imageurl}
                                alt={scooter.name} 
                                className="w-full h-full object-contain" 
                              />
                            </div>
                            
                            <div className="p-4">
                              {/* Keep the rest of the card content the same */}
                              {/* ... */}
                              <div className="flex justify-between items-center mb-2">
                                <h2 className="text-xl font-bold">{scooter.name}</h2>
                                <div className="flex items-center">
                                  <span className="text-yellow-500 mr-1">★</span>
                                  <span>{scooter.rating}</span>
                                </div>
                              </div>
                              
                              <p className="text-gray-600 mb-4">{scooter.model}</p>
                              
                              <div className="grid grid-cols-2 gap-2 mb-4">
                                <div className="flex items-center">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                  </svg>
                                  <span className="text-sm">{scooter.location}</span>
                                </div>
                                <div className="flex justify-end">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V5z" clipRule="evenodd" />
                                  </svg>
                                  <span className="text-sm">{scooter.support}</span>
                                </div>
                                <div className="flex items-center">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                  <span className="text-sm">{scooter.maxspeed}</span>
                                </div>
                                <div className="flex justify-end">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                                    <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1v-5h-4V6H4a1 1 0 00-1-1z" />
                                    <path d="M14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5h-4V7z" />
                                  </svg>
                                  <span className="text-sm">{scooter.mileage}</span>
                                </div>
                              </div>
                              
                              <div className="flex justify-between items-center mb-4">
                                <div>
                                  <span className="text-gray-600 text-sm">Owned by</span>
                                  <p className="font-medium">{scooter.owner}</p>
                                </div>
                                <div>
                                  <span className="text-gray-600 text-sm">Available</span>
                                  <p className="font-medium text-center">{scooter.available}</p>
                                </div>
                              </div>
                              
                              <div className="flex justify-between items-center">
                                <p className="text-purple-600 text-2xl font-bold">₹{scooter.priceperhour}/hr</p>
                                <button 
                                  onClick={() => handleBookingClick(scooter)}
                                  disabled={scooter.available === 0}
                                  className={`px-4 py-2 rounded-lg font-semibold ${
                                    scooter.available > 0 
                                      ? 'bg-black text-white hover:bg-gray-800' 
                                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                  }`}
                                >
                                  {scooter.available > 0 ? 'Book Now' : 'Book Now'}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </main>
        
        {/* Render Booking Modal as a separate component */}
        {showBookingModal && selectedScooter && (
          <BookingModal 
            scooter={selectedScooter}
            onClose={handleCloseModal}
            onSubmit={handleBookingSubmit}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}