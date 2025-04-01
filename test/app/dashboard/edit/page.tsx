"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  name?: string;
  phone_number?: string;
  address?: string;
  created_at?: string;
  profile_photo_path?: string;
  driving_license_image_path?: string;
}

export default function EditProfile() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [session, setSession] = useState<any | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [message, setMessage] = useState({ text: "", type: "" });

  // Form state for editable fields
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");

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
        // Get user profile
        await fetchUserProfile(session.user.id);
        setIsLoading(false);
      } catch (err) {
        console.error("Unexpected error getting session:", err);
        setIsLoading(false);
        router.push('/');
      }
    };
    
    getSession();
  }, [supabase, router]);

  // Fetch user profile from users table
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        console.error("Error fetching user profile:", error);
        // Create a basic profile with just email if we couldn't fetch one
        const basicProfile = {
          id: "",
          user_id: userId,
          email: session?.user?.email || 'User',
          name: "",
          phone_number: "",
          address: ""
        };
        setUserProfile(basicProfile);
        setName(basicProfile.name || "");
        setPhoneNumber(basicProfile.phone_number || "");
        setAddress(basicProfile.address || "");
        return;
      }

      // Set the user profile data
      setUserProfile(data);
      setName(data.name || "");
      setPhoneNumber(data.phone_number || "");
      setAddress(data.address || "");
    } catch (err) {
      console.error("Error fetching user profile:", err);
      const basicProfile = {
        id: "",
        user_id: userId,
        email: session?.user?.email || 'User',
        name: "",
        phone_number: "",
        address: ""
      };
      setUserProfile(basicProfile);
      setName(basicProfile.name || "");
      setPhoneNumber(basicProfile.phone_number || "");
      setAddress(basicProfile.address || "");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ text: "", type: "" });

    try {
      if (!session?.user?.id) {
        throw new Error("User ID not found");
      }

      const updatedProfile = {
        name,
        phone_number: phoneNumber,
        address
      };

      if (userProfile?.id) {
        // Update existing profile
        const { error } = await supabase
          .from('users')
          .update(updatedProfile)
          .eq('user_id', session.user.id);

        if (error) throw error;
      } else {
        // Insert new profile with user information
        const { error } = await supabase
          .from('users')
          .insert({
            user_id: session.user.id,
            email: session.user.email,
            ...updatedProfile
          });

        if (error) throw error;
      }

      setMessage({ 
        text: "Profile information updated successfully!", 
        type: "success" 
      });
      
      // Refresh the user profile data
      await fetchUserProfile(session.user.id);
      
      // Redirect after a short delay to show success message
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (error: any) {
      console.error("Error updating profile:", error);
      setMessage({ 
        text: `Error updating profile: ${error.message}`, 
        type: "error" 
      });
    } finally {
      setIsSaving(false);
    }
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
            <Link href="/dashboard" className="hover:text-gray-300">Dashboard</Link>
            <Link href="/admin" className="hover:text-gray-300">Admin Login</Link>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto py-8 px-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden max-w-4xl mx-auto">
          {/* Page header */}
          <div className="bg-gray-800 text-white p-6">
            <h1 className="text-2xl font-bold">Edit Profile</h1>
            <p className="text-gray-300">Update your personal information</p>
          </div>
          
          {/* Form */}
          <div className="p-6">
            {message.text && (
              <div className={`p-4 mb-6 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Editable Profile Information */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
                <div className="space-y-4">
                  {/* Email (read-only) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={userProfile?.email || ''}
                      disabled
                      className="w-full p-2 bg-gray-100 border border-gray-300 rounded-md"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Email cannot be changed
                    </p>
                  </div>
                  
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  {/* Phone Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  {/* Address */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      rows={3}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    ></textarea>
                  </div>
                </div>
              </div>

              {/* Driving License (Read-only) */}
              <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">Driving License</h2>
                <p className="text-gray-600 mb-4">
                  Your driving license information is displayed below. For security reasons, you cannot edit this information directly.
                  Contact support if you need to update your license details.
                </p>
              </div>
              
              <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-6 bg-gray-50 p-4 rounded-lg">
                <div className="w-full md:w-1/3">
                  <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                    {userProfile?.driving_license_image_path ? (
                      <img 
                        src={userProfile.driving_license_image_path} 
                        alt="License preview" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-gray-400 text-center p-4">
                        <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        <p>No license image</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="w-full md:w-2/3">
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-yellow-700">
                          To update your driving license, please contact customer support.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 text-sm text-gray-600">
                    <p><strong>License Status:</strong> {userProfile?.driving_license_image_path ? 'Verified' : 'Not uploaded'}</p>
                    {userProfile?.driving_license_image_path && <p><strong>Last Updated:</strong> {userProfile?.created_at ? new Date(userProfile.created_at).toLocaleDateString() : 'Unknown'}</p>}
                  </div>
                </div>
              </div>
              
              {/* Buttons */}
              <div className="mt-8 flex justify-end space-x-4">
                <Link href="/dashboard">
                  <button type="button" className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-6 rounded-md">
                    Cancel
                  </button>
                </Link>
                <button 
                  type="submit" 
                  className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-md flex items-center"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : "Update Profile"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}