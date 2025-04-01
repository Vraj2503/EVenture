// app/admin/dashboard/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import DashboardHeader from "./DashboardHeader";
import StoreStats from "./StoreStats";
import QuickActions from "./QuickActions"
import ScooterManagement from "./ScooterManagement";
import BookingManagement from "./BookingManagement";

// Define TypeScript interfaces
export type AdminData = {
  id: string;
  name: string;
  email: string;
  store_id: number;
  store_location: string;
  number_of_vehicles: number;
  total_revenue: number;
  created_at: string;
};

export default function AdminDashboard() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  
  const [loading, setLoading] = useState(true);
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'scooters'>('overview');
  
  useEffect(() => {
    const checkAdminAuth = async () => {
      setLoading(true);
      
      // Check if user is logged in
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session) {
        // Not logged in, redirect to admin login
        router.push('/admin');
        return;
      }
      
      // Check if user is an admin
      const { data: adminData, error: adminError } = await supabase
        .from('admins')
        .select('*')
        .eq('email', sessionData.session.user.email)
        .single();
      
      if (adminError || !adminData) {
        // Not an admin, sign out and redirect
        await supabase.auth.signOut();
        router.push('/admin');
        return;
      }
      
      // User is a valid admin
      setAdminData(adminData as AdminData);
      setLoading(false);
    };
    
    checkAdminAuth();
  }, [supabase, router]);
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin');
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-2xl font-medium text-gray-600">Loading...</div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-100">
      <DashboardHeader adminData={adminData} onLogout={handleLogout} />
      
      <main className="container mx-auto px-4 py-8">
        {adminData && (
          <>
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h1 className="text-2xl font-bold mb-4">Welcome, {adminData.name}!</h1>
              <p className="text-gray-600">
                Manage your EV rental store from this dashboard. Here's a quick overview of your store.
              </p>
            </div>
            
            {/* Navigation Tabs */}
            <div className="flex border-b border-gray-200 mb-8">
              <button
                className={`px-4 py-2 font-medium ${
                  activeTab === 'overview' 
                    ? 'border-b-2 border-purple-500 text-purple-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('overview')}
              >
                Overview
              </button>
              <button
                className={`px-4 py-2 font-medium ${
                  activeTab === 'bookings' 
                    ? 'border-b-2 border-purple-500 text-purple-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('bookings')}
              >
                Bookings
              </button>
              <button
                className={`px-4 py-2 font-medium ${
                  activeTab === 'scooters' 
                    ? 'border-b-2 border-purple-500 text-purple-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('scooters')}
              >
                Scooters
              </button>
            </div>
            
            {/* Tab Content */}
            {activeTab === 'overview' && (
              <>
                <StoreStats adminData={adminData} />
                <QuickActions />
              </>
            )}
            
            {activeTab === 'bookings' && (
              <BookingManagement supabase={supabase} />
            )}
            
            {activeTab === 'scooters' && (
              <ScooterManagement supabase={supabase} />
            )}
          </>
        )}
        
        <div className="text-center text-gray-500 text-sm mt-8">
          <p>Need help? Contact system support at support@eventure.com</p>
        </div>
      </main>
    </div>
  );
}