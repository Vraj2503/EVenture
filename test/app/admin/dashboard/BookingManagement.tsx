// app/admin/dashboard/BookingManagement.tsx
"use client";

import { useState, useEffect } from "react";
import { SupabaseClient } from "@supabase/supabase-js";

interface User {
  id: string;
  email: string;
  name?: string; // Make optional since it might not exist in your users table
}

interface Scooter {
  id: string;
  name: string;
}

interface Booking {
  id: string;
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
  created_at: string;
  updated_at?: string;
  // Join fields
  user?: User;
  scooter?: Scooter;
}

interface BookingManagementProps {
  supabase: SupabaseClient;
}

export default function BookingManagement({ supabase }: BookingManagementProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('all');

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      // First, let's fetch the bookings
      let query = supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply status filter if not 'all'
      if (statusFilter !== 'all') {
        query = query.eq('booking_status', statusFilter);
      }

      const { data: bookingsData, error: bookingsError } = await query;

      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError);
        throw bookingsError;
      }

      // Create a temporary array to hold our enhanced bookings
      const enhancedBookings: Booking[] = [];

      // For each booking, fetch the user and scooter details
      for (const booking of bookingsData || []) {
        // Fetch user details
        const { data: userData, error: userError } = await supabase
          .from('users') // Make sure this matches your users table name
          .select('id, email, name') // Adjust these fields based on your users table
          .eq('id', booking.user_id)
          .single();

        if (userError && userError.code !== 'PGRST116') { // PGRST116 is "Row not found" which we'll handle
          console.error('Error fetching user:', userError);
        }

        // Fetch scooter details
        const { data: scooterData, error: scooterError } = await supabase
          .from('scooters') // Make sure this matches your scooters table name
          .select('id, name')
          .eq('id', booking.scooter_id)
          .single();

        if (scooterError && scooterError.code !== 'PGRST116') {
          console.error('Error fetching scooter:', scooterError);
        }

        // Add the enhanced booking to our array
        enhancedBookings.push({
          ...booking,
          user: userData || undefined,
          scooter: scooterData || undefined
        });
      }

      setBookings(enhancedBookings);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (bookingId: string, newStatus: 'confirmed' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          booking_status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (error) {
        console.error('Error updating booking status:', error);
        throw error;
      }

      // Update the local state
      setBookings(prev => 
        prev.map(booking => 
          booking.id === bookingId 
            ? { ...booking, booking_status: newStatus, updated_at: new Date().toISOString() }
            : booking
        )
      );

      alert(`Booking ${newStatus === 'confirmed' ? 'confirmed' : 'cancelled'} successfully!`);
    } catch (error) {
      console.error('Failed to update booking status:', error);
      alert('Failed to update booking status. Please try again.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">Pending</span>;
      case 'confirmed':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Confirmed</span>;
      case 'cancelled':
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">Cancelled</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">{status}</span>;
    }
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN');
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h2 className="text-xl font-bold mb-4 md:mb-0">Booking Management</h2>
        
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">Filter:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="border rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Bookings</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          
          <button
            onClick={fetchBookings}
            className="bg-gray-200 hover:bg-gray-300 rounded-md px-3 py-1"
          >
            Refresh
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <p className="text-gray-500">Loading bookings...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No bookings found with the selected filter.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Booking Ref
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Scooter
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pickup
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dropoff
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {bookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {booking.booking_reference}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {booking.user?.name || booking.user?.email || 'User: ' + booking.user_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {booking.scooter?.name || 'Scooter: ' + booking.scooter_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {booking.pickup_location}<br />
                    <span className="text-xs">{booking.pickup_date} {booking.pickup_time}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {booking.dropoff_location}<br />
                    <span className="text-xs">{booking.dropoff_date} {booking.dropoff_time}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ₹{booking.total_amount}<br />
                    <span className="text-xs">{booking.total_hours} hours</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(booking.booking_status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {booking.booking_status === 'pending' && (
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleStatusChange(booking.id, 'confirmed')}
                          className="text-green-600 hover:text-green-900 bg-green-100 hover:bg-green-200 px-2 py-1 rounded"
                        >
                          Confirm
                        </button>
                        <button 
                          onClick={() => handleStatusChange(booking.id, 'cancelled')}
                          className="text-red-600 hover:text-red-900 bg-red-100 hover:bg-red-200 px-2 py-1 rounded"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                    {booking.booking_status === 'confirmed' && (
                      <button 
                        onClick={() => handleStatusChange(booking.id, 'cancelled')}
                        className="text-red-600 hover:text-red-900 bg-red-100 hover:bg-red-200 px-2 py-1 rounded"
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}