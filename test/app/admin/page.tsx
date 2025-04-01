"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Session } from "@supabase/auth-helpers-nextjs";

// Define types for admin data
type AdminData = {
  id: string;
  name: string;
  email: string;
  store_id: number;
  store_location: string;
  number_of_vehicles: number;
  total_revenue: number;
  created_at: string;
};

export default function AdminPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Login form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Additional signup form fields
  const [name, setName] = useState("");
  const [storeLocation, setStoreLocation] = useState("");
  
  // Admin authentication check
  useEffect(() => {
    const checkAdminSession = async () => {
      const { data } = await supabase.auth.getSession();
      
      if (data.session) {
        // Check if the logged-in user is an admin
        const { data: adminData, error: adminError } = await supabase
          .from('admins')
          .select('id')
          .eq('email', data.session.user.email)
          .single();
          
        if (adminData) {
          // User is verified as admin, redirect to admin dashboard
          router.push('/admin/dashboard');
        }
      }
    };
    
    checkAdminSession();
  }, [supabase, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    try {
      // First, authenticate using Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (authError) {
        setError(authError.message);
        setIsLoading(false);
        return;
      }
      
      // Check if user data exists
      if (!authData.user) {
        setError("Authentication failed. Please try again.");
        setIsLoading(false);
        return;
      }
      
      // Then verify if the user is an admin
      const { data: adminData, error: adminError } = await supabase
        .from('admins')
        .select('id')
        .eq('email', email)
        .single();
      
      if (adminError || !adminData) {
        // Sign out the user if they're not an admin
        await supabase.auth.signOut();
        setError("User is not authorized as an admin");
        setIsLoading(false);
        return;
      }
      
      // Admin authenticated successfully
      setSuccess("Login successful!");
      // Redirect to admin dashboard
      router.push('/admin/dashboard');
      
    } catch (err) {
      console.error("Unexpected error during login:", err);
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    if (!name || !email || !password || !storeLocation) {
      setError("All fields are required");
      setIsLoading(false);
      return;
    }
    
    try {
      // First, create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            is_admin: true
          },
          emailRedirectTo: `${window.location.origin}/admin/verify`
        }
      });
      
      if (authError) {
        setError(authError.message);
        setIsLoading(false);
        return;
      }
      
      // Check if user was created successfully
      if (!authData.user) {
        setError("Failed to create user. Please try again.");
        setIsLoading(false);
        return;
      }
      
      // Then, create admin record in admins table
      const { error: adminError } = await supabase
        .from('admins')
        .insert([
          {
            name,
            email,
            password: "AUTH_MANAGED", // We don't store actual passwords, just a placeholder
            store_location: storeLocation
          }
        ]);
      
      if (adminError) {
        console.error("Failed to create admin record:", adminError);
        setError("Failed to complete registration. Please contact support.");
        setIsLoading(false);
        return;
      }
      
      setSuccess("Admin account created! Please check your email to verify your account.");
      setIsSignUp(false); // Switch back to login view
      
    } catch (err) {
      console.error("Unexpected error during signup:", err);
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/">
            <div className="inline-block">
              <img 
                src="/download.svg" 
                alt="EVenture Logo" 
                className="h-12 w-12 mx-auto"
              />
              <h2 className="text-3xl font-light mt-2">EVenture</h2>
            </div>
          </Link>
          <h1 className="text-2xl font-bold mt-4">
            {isSignUp ? 'Admin Registration' : 'Admin Login'}
          </h1>
          <p className="text-gray-600 mt-2">
            {isSignUp 
              ? 'Create your admin account to manage your EV rental store'
              : 'Login to access your admin dashboard'
            }
          </p>
        </div>
        
        {/* Error and Success Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
            {success}
          </div>
        )}
        
        {/* Login/Signup Form */}
        <form onSubmit={isSignUp ? handleSignUp : handleLogin}>
          {/* Name Field (Signup only) */}
          {isSignUp && (
            <div className="mb-4">
              <label htmlFor="name" className="block text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                required
                disabled={isLoading}
              />
            </div>
          )}
          
          {/* Email Field */}
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 mb-1">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
              required
              disabled={isLoading}
            />
          </div>
          
          {/* Password Field */}
          <div className="mb-4">
            <label htmlFor="password" className="block text-gray-700 mb-1">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
              required
              minLength={6}
              disabled={isLoading}
            />
          </div>
          
          {/* Store Location (Signup only) */}
          {isSignUp && (
            <div className="mb-6">
              <label htmlFor="storeLocation" className="block text-gray-700 mb-1">Store Location</label>
              <input
                type="text"
                id="storeLocation"
                value={storeLocation}
                onChange={(e) => setStoreLocation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                required
                disabled={isLoading}
                placeholder="e.g. San Francisco, CA"
              />
            </div>
          )}
          
          {/* Submit Button */}
          <button
            type="submit"
            className={`w-full py-2 px-4 rounded-md font-medium text-white 
              ${isLoading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-black hover:bg-gray-800'}`}
            disabled={isLoading}
          >
            {isLoading 
              ? 'Processing...' 
              : isSignUp 
                ? 'Create Admin Account' 
                : 'Login'
            }
          </button>
        </form>
        
        {/* Toggle between Login and Signup */}
        <div className="mt-6 text-center">
          {isSignUp ? (
            <p>
              Already have an admin account?{' '}
              <button 
                onClick={() => {
                  setIsSignUp(false);
                  setError("");
                  setSuccess("");
                }}
                className="text-blue-600 hover:underline"
                disabled={isLoading}
              >
                Login
              </button>
            </p>
          ) : (
            <p>
              Need to register a new store?{' '}
              <button 
                onClick={() => {
                  setIsSignUp(true);
                  setError("");
                  setSuccess("");
                }}
                className="text-blue-600 hover:underline"
                disabled={isLoading}
              >
                Create Admin Account
              </button>
            </p>
          )}
        </div>
        
        {/* Back to Homepage Link */}
        <div className="mt-8 text-center">
          <Link href="/" className="text-gray-600 hover:text-gray-800">
            ← Back to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}