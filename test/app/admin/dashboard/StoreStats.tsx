import React, { useState, useEffect } from 'react';
import { AdminData } from './page';
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

type StoreStatsProps = {
  adminData: AdminData;
};

const StoreStats: React.FC<StoreStatsProps> = ({ adminData }) => {
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [totalScooters, setTotalScooters] = useState<number>(0);
  const [loading, setLoading] = useState({
    revenue: true,
    scooters: true
  });
  const supabase = createClientComponentClient();
  
  // Fetch total revenue from all stores
  useEffect(() => {
    const fetchTotalRevenue = async () => {
      setLoading(prev => ({ ...prev, revenue: true }));
      
      try {
        // Fetch all confirmed bookings across all stores
        const { data: bookings, error } = await supabase
          .from('bookings')
          .select('total_amount')
          .eq('booking_status', 'confirmed');
        
        if (error) {
          console.error('Error fetching bookings:', error);
          return;
        }
        
        // Calculate total revenue from confirmed bookings
        const calculatedRevenue = bookings.reduce((sum, booking) => {
          return sum + (parseFloat(booking.total_amount) || 0);
        }, 0);
        
        setTotalRevenue(calculatedRevenue);
      } catch (err) {
        console.error('Error in revenue calculation:', err);
      } finally {
        setLoading(prev => ({ ...prev, revenue: false }));
      }
    };
    
    fetchTotalRevenue();
  }, [supabase]);
  
  // Fetch total number of scooters
  useEffect(() => {
    const fetchTotalScooters = async () => {
      setLoading(prev => ({ ...prev, scooters: true }));
      
      try {
        // Count all scooters in the database
        const { count, error } = await supabase
          .from('scooters')
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.error('Error fetching scooter count:', error);
          return;
        }
        
        setTotalScooters(count || 0);
      } catch (err) {
        console.error('Error in scooter count:', err);
      } finally {
        setLoading(prev => ({ ...prev, scooters: false }));
      }
    };
    
    fetchTotalScooters();
  }, [supabase]);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-600 mb-2">Store ID</h2>
        <p className="text-3xl font-bold">{adminData.store_id}</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-600 mb-2">Scooters</h2>
        {loading.scooters ? (
          <p className="text-xl font-bold text-gray-400">Counting...</p>
        ) : (
          <p className="text-3xl font-bold">{totalScooters}</p>
        )}
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-600 mb-2">Total Revenue (All Stores)</h2>
        {loading.revenue ? (
          <p className="text-xl font-bold text-gray-400">Calculating...</p>
        ) : (
          <p className="text-3xl font-bold">₹{totalRevenue.toFixed(2)}</p>
        )}
      </div>
    </div>
  );
};

export default StoreStats;