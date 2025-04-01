"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Session } from "@supabase/auth-helpers-nextjs";

export default function Home() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationStep, setVerificationStep] = useState(1); // 1 for document form, 2 for selfie
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState('');
  
  // Verification form states
  const [name, setName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [verificationEmail, setVerificationEmail] = useState('');
  const [address, setAddress] = useState('');
  const [drivingLicense, setDrivingLicense] = useState<File | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  
  // Webcam and selfie states
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCapture, setHasCapture] = useState(false);
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Session Error:", error.message);
        } else {
          setSession(data.session);
          
          // If user is logged in, check verification status
          if (data.session) {
            const user = data.session.user;
            checkVerificationStatus(user.id);
          }
        }
        setIsLoading(false);
      } catch (err) {
        console.error("Unexpected error getting session:", err);
        setIsLoading(false);
      }
    };
    
    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      
      // Check verification status when auth state changes
      if (session) {
        checkVerificationStatus(session.user.id);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
      // Clean up webcam stream if it exists
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [supabase]);

  // Updated function to check if a user is verified
  const checkVerificationStatus = async (userId: string) => {
    try {
      // Now we check if an entry exists in the users table for this auth user
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (error) {
        // If error code is PGRST116 (not found), user is not verified
        if (error.code === 'PGRST116') {
          setIsVerified(false);
        } else {
          console.error("Verification status error:", error.message);
          setIsVerified(false);
        }
      } else {
        // If we got data back, the user exists in the table and is verified
        setIsVerified(true);
      }
    } catch (err) {
      console.error("Unexpected error checking verification:", err);
      setIsVerified(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        setAuthError(error.message);
      } else {
        setShowAuthModal(false);
        setEmail('');
        setPassword('');
      }
    } catch (err) {
      console.error("Unexpected error during login:", err);
      setAuthError('An unexpected error occurred');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) {
        setAuthError(error.message);
      } else {
        setAuthError('');
        setShowAuthModal(false);
        setEmail('');
        setPassword('');
        alert('Please check your email for a confirmation link');
      }
    } catch (err) {
      console.error("Unexpected error during sign up:", err);
      setAuthError('An unexpected error occurred');
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Logout Error:", error.message);
      }
    } catch (err) {
      console.error("Unexpected error during logout:", err);
    }
  };

  // Function to handle the booking button click
  // Function to handle the booking button click
const handleBooking = () => {
  if (!session) {
    // User is not logged in, show auth modal
    setShowAuthModal(true);
    return;
  }
  
  if (!isVerified) {
    // User is logged in but not verified, show verification form
    setVerificationStep(1);
    setShowVerificationModal(true);
    // Initialize form with user data if available
    if (session.user.email) {
      setVerificationEmail(session.user.email);
    }
    return;
  }
  
  // User is logged in and verified, redirect to booking page
  router.push('/booking');
};

  // Handle account button click
// Handle account button click
const handleAccountClick = () => {
  if (!session) {
    // If not logged in, show auth modal
    setShowAuthModal(true);
    return;
  }

  if (!isVerified) {
    // If not verified, show verification form
    setVerificationStep(1);
    setShowVerificationModal(true);
    // Initialize form with user data if available
    if (session.user.email) {
      setVerificationEmail(session.user.email);
    }
  } else {
    // If verified, navigate to account page
    router.push('/dashboard');
  }
};

  // Handle file upload for driving license
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setDrivingLicense(e.target.files[0]);
    }
  };

  // Move to selfie capture step
  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !mobileNumber || !verificationEmail || !address || !drivingLicense) {
      alert('Please fill in all fields and upload your driving license');
      return;
    }
    
    setVerificationStep(2);
    // Start webcam
    startWebcam();
  };

  // Start webcam for selfie
  const startWebcam = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user" } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      
      setStream(mediaStream);
      setHasCapture(false);
    } catch (err) {
      console.error("Error accessing webcam:", err);
      alert("Unable to access the webcam. Please check your camera permissions.");
    }
  };

  // Capture selfie
  const captureSelfie = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw the video frame to the canvas
      context?.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Get the image data URL
      const imageDataURL = canvas.toDataURL('image/png');
      setSelfieImage(imageDataURL);
      setHasCapture(true);
      
      // Stop the webcam stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    }
  };

  // Retake selfie
  const retakeSelfie = () => {
    setSelfieImage(null);
    setHasCapture(false);
    startWebcam();
  };

  // Helper function to convert File to base64
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = error => reject(error);
    });
  };

  // Updated function to submit verification data to the new users table
// Updated function to submit verification data to the new users table
const submitVerification = async () => {
  if (!selfieImage || !drivingLicense || !session) {
    alert('Missing required verification data or user session');
    return;
  }

  try {
    // Show loading state
    setIsVerifying(true);

    // Convert the license file to base64
    const licenseBase64 = await convertFileToBase64(drivingLicense);
    
    // Selfie is already in base64 format, just use it directly
    // (selfieImage is already a data URL from the canvas.toDataURL() call)
    
    // Prepare the data for the API
    const verificationData = {
      userId: session.user.id,
      license_base64: licenseBase64,
      selfie_base64: selfieImage
    };
    
    // Call the Flask API for face verification
    const verificationResponse = await fetch('http://localhost:5000/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(verificationData),
    });
    
    if (!verificationResponse.ok) {
      const errorData = await verificationResponse.json();
      throw new Error(errorData.error || `API error: ${verificationResponse.status}`);
    }
    
    const verificationResult = await verificationResponse.json();
    
    // Only proceed to add to users table if verification succeeded
    if (verificationResult.verified) {
      // Generate unique paths for storing images
      const timestamp = new Date().getTime();
      const licenseImagePath = `licenses/${session.user.id}_${timestamp}.png`;
      const profilePhotoPath = `profiles/${session.user.id}_${timestamp}.png`;
      
      // Convert selfie base64 to blob for storage
      const selfieBlob = await fetch(selfieImage).then(r => r.blob());
      
      // Upload license image to storage
      const { error: licenseUploadError } = await supabase.storage
        .from('user-documents')
        .upload(licenseImagePath, drivingLicense);
        
      if (licenseUploadError) {
        throw new Error(`License upload error: ${licenseUploadError.message}`);
      }
      
      // Upload selfie image to storage
      const { error: selfieUploadError } = await supabase.storage
        .from('user-documents')
        .upload(profilePhotoPath, selfieBlob);
        
      if (selfieUploadError) {
        throw new Error(`Selfie upload error: ${selfieUploadError.message}`);
      }
      
      // Save user data to users table
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          name: name,
          phone_number: mobileNumber,
          email: verificationEmail,
          address: address,
          driving_license_image_path: licenseImagePath,
          profile_photo_path: profilePhotoPath,
          user_id: session.user.id,
        });
        
      if (insertError) {
        throw new Error(`Database error: ${insertError.message}`);
      }
      
      // Update local state
      setIsVerified(true);
      setShowVerificationModal(false);
      alert('Your account has been successfully verified!');
    } else {
      // Verification failed
      alert(verificationResult.error || 'Verification failed. The selfie does not match the license photo.');
    }
      
  } catch (error) {
    console.error('Verification error:', error);
    alert(`Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    setIsVerifying(false);
  }
};

  return (
    <div className="h-screen overflow-hidden">
      <div className="relative h-screen">
        {/* Hero Background */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
          style={{ 
            backgroundImage: "url('./image.png')", 
            backgroundSize: 'cover',
            filter: 'brightness(0.3)'
          }}
        />
        
        {/* Authentication Modal */}
        {showAuthModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg w-full max-w-md">
              <h2 className="text-2xl font-bold mb-6">
                {isSignUp ? 'Create Account' : 'Login to EVenture'}
              </h2>
              
              <form onSubmit={isSignUp ? handleSignUp : handleLogin}>
                <div className="mb-4">
                  <label htmlFor="email" className="block text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                    required
                  />
                </div>
                
                <div className="mb-6">
                  <label htmlFor="password" className="block text-gray-700 mb-2">Password</label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                    required
                    minLength={6}
                  />
                </div>

                {authError && (
                  <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                    {authError}
                  </div>
                )}
                
                <div className="flex justify-between items-center mb-4">
                  <button
                    type="submit"
                    className="bg-black hover:bg-gray-800 text-white font-bold py-2 px-6 rounded-md"
                  >
                    {isSignUp ? 'Sign Up' : 'Login'}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setShowAuthModal(false)}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                </div>
              </form>
              
              <div className="text-center border-t pt-4">
                {isSignUp ? (
                  <p>
                    Already have an account?{' '}
                    <button 
                      onClick={() => setIsSignUp(false)} 
                      className="text-blue-600 hover:underline"
                    >
                      Login
                    </button>
                  </p>
                ) : (
                  <p>
                    Don't have an account?{' '}
                    <button 
                      onClick={() => setIsSignUp(true)} 
                      className="text-blue-600 hover:underline"
                    >
                      Sign Up
                    </button>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Account Verification Modal */}
        {showVerificationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg w-full max-w-2xl">
              {/* Step 1: Document Form */}
              {verificationStep === 1 && (
                <>
                  <h2 className="text-2xl font-bold mb-6">Account Verification</h2>
                  <p className="mb-4 text-gray-600">
                    Please complete this verification to access all features. We need to verify your identity for security purposes.
                  </p>
                  
                  <form onSubmit={handleNextStep} className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-gray-700 mb-2">Full Name</label>
                      <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="mobile" className="block text-gray-700 mb-2">Mobile Number</label>
                      <input
                        type="tel"
                        id="mobile"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="verificationEmail" className="block text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        id="verificationEmail"
                        value={verificationEmail}
                        onChange={(e) => setVerificationEmail(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="address" className="block text-gray-700 mb-2">Address</label>
                      <textarea
                        id="address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                        rows={3}
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="license" className="block text-gray-700 mb-2">Driving License</label>
                      <input
                        type="file"
                        id="license"
                        onChange={handleFileChange}
                        accept="image/*,.pdf"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                        required
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Upload a clear image or PDF of your driving license.
                      </p>
                    </div>
                    
                    <div className="flex justify-between pt-4">
                      <button
                        type="button"
                        onClick={() => setShowVerificationModal(false)}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        Cancel
                      </button>
                      
                      <button
                        type="submit"
                        className="bg-black hover:bg-gray-800 text-white font-bold py-2 px-6 rounded-md"
                      >
                        Next
                      </button>
                    </div>
                  </form>
                </>
              )}
              
              {/* Step 2: Selfie Capture */}
              {verificationStep === 2 && (
                <>
                  <h2 className="text-2xl font-bold mb-6">Capture Your Selfie</h2>
                  <p className="mb-4 text-gray-600">
                    Please take a clear selfie for identity verification. Make sure your face is clearly visible.
                  </p>
                  
                  <div className="flex flex-col items-center space-y-4">
                    {!hasCapture ? (
                      <>
                        <div className="relative w-full max-w-md h-64 bg-gray-100 rounded-lg overflow-hidden">
                          <video 
                            ref={videoRef}
                            autoPlay 
                            playsInline
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        </div>
                        
                        <button
                          type="button"
                          onClick={captureSelfie}
                          className="bg-black hover:bg-gray-800 text-white font-bold py-2 px-6 rounded-md"
                        >
                          Take Selfie
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="relative w-full max-w-md h-64 bg-gray-100 rounded-lg overflow-hidden">
                          <img 
                            src={selfieImage || ''} 
                            alt="Your selfie" 
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        </div>
                        
                        <div className="flex space-x-4">
                          <button
                            type="button"
                            onClick={retakeSelfie}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-6 rounded-md"
                          >
                            Retake
                          </button>
                          
                          <button
                            type="button"
                            onClick={submitVerification}
                            disabled={isVerifying}
                            className={`${
                              isVerifying 
                                ? 'bg-gray-400 cursor-not-allowed' 
                                : 'bg-black hover:bg-gray-800'
                            } text-white font-bold py-2 px-6 rounded-md`}
                          >
                            {isVerifying ? 'Verifying...' : 'Start Verification'}
                          </button>
                        </div>
                      </>
                    )}
                    
                    {/* Hidden canvas for capturing the image */}
                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                    
                    <div className="flex justify-between w-full pt-4">
                      <button
                        type="button"
                        onClick={() => setVerificationStep(1)}
                        className="text-gray-600 hover:text-gray-800"
                        disabled={isVerifying}
                      >
                        Back
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setShowVerificationModal(false)}
                        className="text-gray-600 hover:text-gray-800"
                        disabled={isVerifying}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
        
        {/* Navigation */}
        <nav className="relative z-20 flex justify-between items-center p-6">
          <div className="flex items-center">
            <Link href="/">
              <div className="flex items-center cursor-pointer">
                <img 
                  src="/download.svg" 
                  alt="EVenture Logo" 
                  className="h-10 w-10 text-white"
                />
                <span className="ml-2 text-white text-3xl font-light">EVenture</span>
              </div>
            </Link>
          </div>

          <div className="md:flex space-x-8">
            <Link href="/" className="text-white hover:text-gray-300 cursor-pointer">Home</Link>
            <Link href="/services" className="text-white hover:text-gray-300">Services</Link>
            <Link href="/about" className="text-white hover:text-gray-300">About</Link>
            <Link href="/contact" className="text-white hover:text-gray-300">Contact</Link>
            <Link href="/dashboard" className="text-white hover:text-gray-300">Dashboard</Link>
            {/* <Link href="/admin" className="text-white hover:text-gray-300">Admin Login/Signup</Link> */}
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 flex items-center h-screen -mt-16">
          <div className="pl-8 md:pl-16 max-w-6xl">
            <h1 className="text-white text-4xl md:text-6xl font-bold leading-tight mb-8">
              EV Rental
            </h1>
            
            <div className="text-white max-w-2xl">
              <p className="mb-8 text-base md:text-xl">
                A seamless and secure EV rental platform with built-in user verification and payment protection. Get verified, rent effortlessly, and drive with confidence.
              </p>
              
              <div className="flex space-x-4">
                {/* Book Now Button */}
                <button 
                  onClick={handleBooking}
                  className="bg-black hover:bg-gray-800 text-white font-bold py-3 px-8 rounded-lg transition duration-300 transform hover:scale-105"
                >
                  Book Now
                </button>
                
                {/* Account Button */}
                {!isLoading && session && (
                  <button 
                    onClick={handleAccountClick}
                    className={`font-bold py-3 px-8 rounded-lg transition duration-300 transform hover:scale-105 ${
                      isVerified 
                        ? 'bg-green-600 hover:bg-green-700 text-white' 
                        : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                    }`}
                  >
                    {isVerified ? 'Dashboard' : 'Verify Account'}
                  </button>
                )}
                
                {/* Login/Logout Button with Loading State */}
                {isLoading ? (
                  <button 
                    className="bg-gray-400 text-white font-bold py-3 px-8 rounded-lg cursor-not-allowed"
                    disabled
                  >
                    Loading...
                  </button>
                ) : session ? (
                  <button 
                    onClick={handleLogout} 
                    className="bg-black hover:bg-gray-900 text-white font-bold py-3 px-8 rounded-lg transition duration-300"
                  >
                    Logout
                  </button>
                ) : (
                  <button 
                    onClick={() => setShowAuthModal(true)} 
                    className="bg-black hover:bg-gray-900 text-white font-bold py-3 px-8 rounded-lg transition duration-300"
                  >
                    Login / Sign Up
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}