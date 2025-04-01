"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";

// Define types for our data
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

interface UserProfile {
  id: string;
  email: string;
  full_name?: string; // maps to name in your table
  phone?: string; // maps to phone_number in your table
  address?: string;
  created_at?: string;
  profile_photo_path?: string; // Added to match your table
  driving_license_image_path?: string; // Added to match your table
}

export default function Dashboard() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [session, setSession] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showBookings, setShowBookings] = useState(false);
  
  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Session Error:", error.message);
          router.push('/');
          return;
        }
        
        if (!session) {
          // User is not logged in, redirect to home
          router.push('/');
          return;
        }
        
        setSession(session);
        // Get user profile and bookings
        await fetchUserProfile(session.user.id);
        await fetchActiveBookings(session.user.id);
        setIsLoading(false);
      } catch (err) {
        console.error("Unexpected error getting session:", err);
        setIsLoading(false);
        router.push('/');
      }
    };
    
    getSession();
  }, [supabase, router]);

  // Fetch user profile from profiles table
 // Fetch user profile from users table
const fetchUserProfile = async (userId: string) => {
  try {
    // Query the users table instead of profiles
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', userId) // Use user_id field to match auth user id
      .single();
    
    if (error) {
      console.error("Error fetching user profile:", error);
      // Create a basic profile with just email if we couldn't fetch one
      setUserProfile({
        id: userId,
        email: session?.user?.email || 'User'
      });
      return;
    }

    // Map the returned data to match your UserProfile interface
    setUserProfile({
      id: userId,
      email: session?.user?.email || data.email || 'User',
      full_name: data.name,
      phone: data.phone_number,
      address: data.address,
      created_at: data.created_at
    });
  } catch (err) {
    console.error("Error fetching user profile:", err);
    setUserProfile({
      id: userId,
      email: session?.user?.email || 'User'
    });
  }
};

  // Fetch active bookings for the user
  const fetchActiveBookings = async (sessionUserId: string) => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', sessionUserId) // Only fetch bookings matching the session user ID
        .order('pickup_date', { ascending: true });
      
      if (error) {
        console.error("Error fetching bookings:", error);
        throw error;
      }

      // Double-check that all bookings belong to the current user
      const filteredBookings = data?.filter(booking => booking.user_id === sessionUserId) || [];
      setBookings(filteredBookings);
    } catch (err) {
      console.error("Error fetching bookings:", err);
      setBookings([]);
    }
  };

  // Toggle bookings visibility
  const toggleBookings = () => {
    setShowBookings(!showBookings);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-2xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header with navigation */}
      <header className="bg-black text-white p-4">
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
          <nav className="space-x-6">
            <Link href="/" className="hover:text-gray-300">Home</Link>
            <Link href="/services" className="hover:text-gray-300">Services</Link>
            <Link href="/about" className="hover:text-gray-300">About</Link>
            <Link href="/contact" className="hover:text-gray-300">Contact</Link>
            <Link href="/dashboard" className="font-bold">Dashboard</Link>
            <Link href="/admin" className="hover:text-gray-300">Admin Login</Link>
          </nav>
        </div>
      </header>

      {/* Dashboard content */}
      <main className="container mx-auto py-8 px-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Dashboard header */}
          <div className="bg-gray-800 text-white p-6">
            <h1 className="text-2xl font-bold">User Dashboard</h1>
            <p className="text-gray-300">Welcome back, {session?.user?.email}</p>
          </div>
          
          {/* User Profile Section */}
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">User Information</h2>
            <div className="bg-gray-50 p-6 rounded-lg mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-gray-500 mb-1">Full Name</p>
                  <p className="font-medium">{userProfile?.full_name || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Email</p>
                  <p className="font-medium">{userProfile?.email}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Phone</p>
                  <p className="font-medium">{userProfile?.phone || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Address</p>
                  <p className="font-medium">{userProfile?.address || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Member Since</p>
                  <p className="font-medium">
                    {userProfile?.created_at 
                      ? new Date(userProfile.created_at).toLocaleDateString() 
                      : 'Not available'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">User ID</p>
                  <p className="font-medium">{userProfile?.id}</p>
                </div>
              </div>
              <div className="mt-6">
                <Link href="/dashboard/edit">
                  <button className="bg-gray-800 hover:bg-gray-700 text-white py-2 px-4 rounded-md mr-4">
                    Edit Profile
                  </button>
                </Link>
              </div>
            </div>

            {/* Booking Actions */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex space-x-4">
                <button 
                  onClick={toggleBookings} 
                  className="bg-black hover:bg-gray-800 text-white py-2 px-4 rounded-md"
                >
                  {showBookings ? 'Hide Booking History' : 'View Booking History'}
                </button>
                <Link href="/booking">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md">
                    Book a Scooter
                  </button>
                </Link>
              </div>
              <div className="text-sm text-gray-500">
                Total Bookings: {bookings.length}
              </div>
            </div>
            
            {/* Booking History (conditionally rendered) */}
            {showBookings && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Booking History</h2>
                
                {bookings.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-600">You haven't made any bookings yet.</p>
                    <Link href="/booking">
                      <button className="mt-4 bg-black hover:bg-gray-800 text-white py-2 px-6 rounded-md">
                        Book Now
                      </button>
                    </Link>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scooter ID</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pickup/Dropoff</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Locations</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {bookings.map((booking) => (
                          <tr key={booking.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-medium text-gray-900">{booking.booking_reference}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{booking.scooter_id}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {booking.pickup_date} {booking.pickup_time} - {booking.dropoff_date} {booking.dropoff_time}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                <div>From: {booking.pickup_location}</div>
                                <div>To: {booking.dropoff_location}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{booking.total_hours} hours</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">₹{booking.total_amount.toFixed(2)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                ${booking.booking_status === 'confirmed' ? 'bg-green-100 text-green-800' : 
                                  booking.booking_status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                  'bg-red-100 text-red-800'}`}>
                                {booking.booking_status.charAt(0).toUpperCase() + booking.booking_status.slice(1)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <Link href={`/booking/${booking.id}`}>
                                <span className="text-blue-600 hover:text-blue-900 cursor-pointer">View Details</span>
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Stats Section */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-medium text-gray-900">Active Bookings</h3>
                <p className="mt-2 text-3xl font-bold">
                  {bookings.filter(b => b.booking_status === 'confirmed' || b.booking_status === 'pending').length}
                </p>
                <p className="text-sm text-gray-500 mt-1">Current reservations</p>
              </div>
              <div className="bg-white border rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-medium text-gray-900">Total Spent</h3>
                <p className="mt-2 text-3xl font-bold">
                  ₹{bookings.reduce((total, booking) => total + booking.total_amount, 0).toFixed(2)}
                </p>
                <p className="text-sm text-gray-500 mt-1">Lifetime spending</p>
              </div>
              <div className="bg-white border rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-medium text-gray-900">Total Hours</h3>
                <p className="mt-2 text-3xl font-bold">
                  {bookings.reduce((total, booking) => total + booking.total_hours, 0)}
                </p>
                <p className="text-sm text-gray-500 mt-1">Hours rented</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}