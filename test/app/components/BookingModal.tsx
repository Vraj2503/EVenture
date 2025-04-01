import { useState, useEffect } from 'react';
import Script from "next/script";

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

interface BookingModalProps {
  scooter: EVScooter;
  onClose: () => void;
  onSubmit: (bookingData: BookingFormData) => Promise<void>;
}

export interface BookingFormData {
  pickupDate: string;
  pickupTime: string;
  dropoffDate: string;
  dropoffTime: string;
  pickupLocation: string;
  dropoffLocation: string;
  paymentId: string;
  totalAmount: number;
  totalHours: number;
}


export default function BookingModal({ scooter, onClose, onSubmit }: BookingModalProps) {
  const [bookingData, setBookingData] = useState<BookingFormData>({
    pickupDate: "",
    pickupTime: "",
    dropoffDate: "",
    dropoffTime: "",
    pickupLocation: "",
    dropoffLocation: "",
    paymentId:"",
    totalAmount: 0,
    totalHours: 0,
  });
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [totalHours, setTotalHours] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate total amount whenever booking dates/times change
  useEffect(() => {
    const calculateTotalAmount = () => {
      if (!bookingData.pickupDate || !bookingData.pickupTime || 
          !bookingData.dropoffDate || !bookingData.dropoffTime) {
        setTotalAmount(0);
        setTotalHours(0);
        return;
      }

      const pickupDateTime = new Date(
        `${bookingData.pickupDate}T${bookingData.pickupTime}:00`
      );
      const dropoffDateTime = new Date(
        `${bookingData.dropoffDate}T${bookingData.dropoffTime}:00`
      );

      // Calculate difference in milliseconds and convert to hours
      const diffMs = dropoffDateTime.getTime() - pickupDateTime.getTime();
      
      // If invalid date range (end before start), set to 0
      if (diffMs <= 0) {
        setTotalAmount(0);
        setTotalHours(0);
        return;
      }
      
      const diffHours = diffMs / (1000 * 60 * 60);
      // Round up to nearest half hour
      const roundedHours = Math.ceil(diffHours * 2) / 2;
      
      setTotalHours(roundedHours);
      // Calculate total amount based on price per hour
      setTotalAmount(roundedHours * scooter.priceperhour);
    };

    calculateTotalAmount();
  }, [bookingData.pickupDate, bookingData.pickupTime, bookingData.dropoffDate, bookingData.dropoffTime, scooter.priceperhour]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setBookingData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePayment = async () => {
    if (totalAmount <= 0) return;
    
    setIsSubmitting(true);
    
    const options = {
      key: "rzp_test_7gBiukZMwPe9x7", // Replace with your Razorpay key
      amount: totalAmount * 100, // Razorpay uses paise (multiply by 100)
      currency: "INR",
      name: "EV Scooter Rental",
      description: `Booking for ${scooter.name}`,
      image: scooter.imageurl,
      handler: async (response: any) => {        
        try {
          // Add payment details to bookingData
          const updatedBookingData: BookingFormData = {
            ...bookingData,
            paymentId: response.razorpay_payment_id,
            // Include totalAmount and totalHours from the state variables
            totalAmount: totalAmount,
            totalHours: totalHours
          };
          
          setBookingData(updatedBookingData);
          
          await onSubmit(updatedBookingData);
          onClose();
          console.log("Booking completed successfully!");
          
          window.location.href="/dashboard"
          // Redirect removed
        } catch (error) {
          console.error("Error submitting booking:", error);
        } finally {
          setIsSubmitting(false);
        }
      },
      prefill: {
        name: "John Doe",
        email: "johndoe@example.com",
        contact: "9999999999",
      },
      theme: {
        color: "#000000",
      },
      modal: {
        ondismiss: function() {
          setIsSubmitting(false);
        }
      }
    };

    try {
      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error("Error initializing Razorpay:", error);
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    handlePayment();
  };


  // Generate time slots for the dropdown (30 min intervals)
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute of [0, 30]) {
        const hourFormatted = hour.toString().padStart(2, '0');
        const minuteFormatted = minute.toString().padStart(2, '0');
        const time = `${hourFormatted}:${minuteFormatted}`;
        slots.push(time);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Format date for display
  const formatDate = (dateString: string, timeString: string) => {
    if (!dateString || !timeString) return "";
    
    const date = new Date(`${dateString}T${timeString}`);
    return date.toLocaleString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };
  
  const pickupFormatted = formatDate(bookingData.pickupDate, bookingData.pickupTime);
  const dropoffFormatted = formatDate(bookingData.dropoffDate, bookingData.dropoffTime);

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl w-full max-w-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gray-50 p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Book {scooter.name}</h2>
              <button 
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mt-4 flex items-center">
              <div className="h-12 w-12 bg-gray-200 rounded-lg flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-gray-500">{scooter.model}</p>
                <div className="flex items-center mt-1">
                  <div className="flex">
                    {[...Array(Math.floor(scooter.rating))].map((_, i) => (
                      <svg key={i} className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                      </svg>
                    ))}
                    <span className="text-gray-500 text-sm ml-1">{scooter.rating.toFixed(1)}</span>
                  </div>
                  <span className="mx-2 text-gray-300">|</span>
                  <span className="text-gray-500 text-sm">{scooter.available} available</span>
                </div>
              </div>
            </div>
            
            <div className="mt-4 grid grid-cols-2 gap-4 bg-gray-100 p-3 rounded-lg text-sm">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-gray-700">₹{scooter.priceperhour}/hour</span>
              </div>
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-gray-700">{scooter.maxspeed} max speed</span>
              </div>
            </div>
          </div>
          
          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column - Rental Period */}
              <div>
                <h3 className="text-lg font-medium mb-3">Select rental period</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="pickupDate" className="block text-sm font-medium text-gray-700 mb-1">Pickup Date</label>
                      <input 
                        type="date" 
                        id="pickupDate"
                        name="pickupDate"
                        value={bookingData.pickupDate}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black text-sm"
                        required
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="pickupTime" className="block text-sm font-medium text-gray-700 mb-1">Pickup Time</label>
                      <select
                        id="pickupTime"
                        name="pickupTime"
                        value={bookingData.pickupTime}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black text-sm appearance-none"
                        required
                      >
                        <option value="">Select time</option>
                        {timeSlots.map(time => (
                          <option key={`pickup-${time}`} value={time}>{time}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="dropoffDate" className="block text-sm font-medium text-gray-700 mb-1">Drop-off Date</label>
                      <input 
                        type="date" 
                        id="dropoffDate"
                        name="dropoffDate"
                        value={bookingData.dropoffDate}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black text-sm"
                        required
                        min={bookingData.pickupDate || new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="dropoffTime" className="block text-sm font-medium text-gray-700 mb-1">Drop-off Time</label>
                      <select
                        id="dropoffTime"
                        name="dropoffTime"
                        value={bookingData.dropoffTime}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black text-sm appearance-none"
                        required
                      >
                        <option value="">Select time</option>
                        {timeSlots.map(time => (
                          <option key={`dropoff-${time}`} value={time}>{time}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Location Information */}
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-3">Location details</h3>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="pickupLocation" className="block text-sm font-medium text-gray-700 mb-1">Pickup Location</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <input 
                          type="text" 
                          id="pickupLocation"
                          name="pickupLocation"
                          value={bookingData.pickupLocation}
                          onChange={handleInputChange}
                          placeholder="Enter pickup location"
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black text-sm"
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="dropoffLocation" className="block text-sm font-medium text-gray-700 mb-1">Drop-off Location</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <input 
                          type="text" 
                          id="dropoffLocation"
                          name="dropoffLocation"
                          value={bookingData.dropoffLocation}
                          onChange={handleInputChange}
                          placeholder="Enter drop-off location"
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black text-sm"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Booking Summary */}
              <div>
                {(bookingData.pickupDate && bookingData.pickupTime && bookingData.dropoffDate && bookingData.dropoffTime) ? (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 h-full">
                    <h3 className="font-medium text-lg mb-3">Booking Summary</h3>
                    
                    {totalAmount > 0 ? (
                      <>
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center text-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <div>
                              <span className="font-medium">Pickup:</span> {pickupFormatted}
                            </div>
                          </div>
                          <div className="flex items-center text-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <div>
                              <span className="font-medium">Drop-off:</span> {dropoffFormatted}
                            </div>
                          </div>
                        </div>
                        
                        <div className="pt-3 border-t border-gray-200">
                          <div className="flex justify-between mb-2 text-sm">
                            <span>Duration:</span>
                            <span>{totalHours} hour{totalHours !== 1 ? 's' : ''}</span>
                          </div>
                          <div className="flex justify-between mb-2 text-sm">
                            <span>Rate:</span>
                            <span>₹{scooter.priceperhour} per hour</span>
                          </div>
                          <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200 mt-2">
                            <span>Total Amount:</span>
                            <span>₹{totalAmount.toFixed(2)}</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-yellow-600 bg-yellow-50 p-3 rounded flex items-center text-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span>Drop-off time must be after pickup time.</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200 p-6">
                    <div className="text-center text-gray-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p>Select rental dates and times to see your booking summary</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-8 flex justify-end space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={totalAmount <= 0 || isSubmitting}
                className={`px-6 py-2 rounded-md text-white font-medium focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 ${
                  totalAmount <= 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-black hover:bg-gray-800'
                } ${isSubmitting ? 'opacity-75 cursor-wait' : ''}`}
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  `Pay ₹${totalAmount.toFixed(2)}`
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}