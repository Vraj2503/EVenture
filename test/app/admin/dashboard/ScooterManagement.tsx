import React, { useState, useEffect } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { Scooter } from './ScooterTypes';
import Notification from './Notification';

type ScooterManagementProps = {
  supabase: SupabaseClient;
};

type ScooterFormData = Omit<Scooter, 'id' | 'created_at'> & {
  id?: string;
};

const initialFormData: ScooterFormData = {
  name: '',
  model: '',
  imageurl: '',
  priceperhour: 0,
  maxspeed: '',
  location: '',
  mileage: '',
  support: '',
  owner: '',
  available: 1,
  rating: 0
};

const ScooterManagement: React.FC<ScooterManagementProps> = ({ supabase }) => {
  const [scooters, setScooters] = useState<Scooter[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [formData, setFormData] = useState<ScooterFormData>(initialFormData);
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error';
  }>({ show: false, message: '', type: 'success' });
  
  // Fetch initial data with polling instead of realtime
  useEffect(() => {
    // Check if supabase is defined before using it
    if (!supabase) {
      console.error('Supabase client is not initialized');
      showNotification('Database connection error', 'error');
      setLoading(false);
      return;
    }
    
    fetchScooters();
    
    // Set up polling as a more reliable alternative to realtime
    const pollingInterval = setInterval(() => {
      console.log('Polling for scooter changes...');
      fetchScooters();
    }, 50000); // Poll every 5 seconds
    
    return () => {
      clearInterval(pollingInterval);
    };
  }, [supabase]);
  
  const fetchScooters = async () => {
    // Additional safety check
    if (!supabase) {
      console.error('Supabase client is not initialized');
      showNotification('Database connection error', 'error');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      console.log('Fetching scooters from database...');
      
      const { data, error } = await supabase
        .from('scooters')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Supabase fetch error details:', error);
        throw error;
      }
      
      console.log('Scooters fetched successfully:', data);
      setScooters(data || []);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error fetching scooters:', error);
      showNotification(`Failed to load scooters: ${errorMessage}`, 'error');
    } finally {
      setLoading(false);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    // Handle numeric values
    if (type === 'number') {
      setFormData({ ...formData, [name]: parseFloat(value) });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };
  
  const resetForm = () => {
    setFormData(initialFormData);
  };
  
  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };
  
  const openEditModal = (scooter: Scooter) => {
    setFormData({ ...scooter });
    setShowEditModal(true);
  };
  
  const handleAddScooter = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      console.log('Attempting to add scooter with data:', formData);
      
      // Make a deep copy of form data to avoid modifying the original
      const scooterToAdd = { ...formData };
      
      // Explicit type conversion for numeric fields
      scooterToAdd.priceperhour = Number(scooterToAdd.priceperhour);
      scooterToAdd.available = Number(scooterToAdd.available);
      scooterToAdd.rating = Number(scooterToAdd.rating);
      
      // Log the final data being sent to Supabase
      console.log('Sending to Supabase:', scooterToAdd);
      
      const { data, error } = await supabase
        .from('scooters')
        .insert([scooterToAdd])
        .select(); // Add .select() to return the inserted record
        
      if (error) {
        console.error('Supabase error details:', error);
        throw error;
      }
      
      console.log('Successfully added scooter:', data);
      
      // Call fetchScooters directly instead of waiting for poll
      await fetchScooters();
      showNotification('Scooter added successfully', 'success');
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      // More detailed error logging
      if (error instanceof Error) {
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      } else {
        console.error('Unknown error type:', error);
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
      showNotification(`Failed to add scooter: ${errorMessage}`, 'error');
    } finally {
      setLoading(false);
    }
  };
  
  const handleUpdateScooter = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.id) {
      showNotification('Error: Scooter ID is missing', 'error');
      return;
    }
    
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('scooters')
        .update(formData)
        .eq('id', formData.id);
        
      if (error) throw error;
      
      await fetchScooters();
      showNotification('Scooter updated successfully', 'success');
      setShowEditModal(false);
      resetForm();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showNotification(`Failed to update scooter: ${errorMessage}`, 'error');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteScooter = async (id: string) => {
    if (!confirm('Are you sure you want to delete this scooter?')) {
      return;
    }
    
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('scooters')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      await fetchScooters();
      showNotification('Scooter deleted successfully', 'success');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showNotification(`Failed to delete scooter: ${errorMessage}`, 'error');
    } finally {
      setLoading(false);
    }
  };
  
  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ show: true, message, type });
    
    // Auto-hide notification after 3 seconds
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 3000);
  };
  
  // Component for the dashboard cards
  const DashboardCard = ({ title, value, icon }: { title: string, value: string | number, icon: string }) => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center">
        <div className="p-3 rounded-full bg-blue-100 text-blue-600">
          <i className={icon}></i>
        </div>
        <div className="ml-4">
          <h3 className="text-sm text-gray-500 uppercase font-semibold">{title}</h3>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
      </div>
    </div>
  );
  
  // Scooter Form Modal component
  const ScooterFormModal = ({ 
    show, 
    onClose, 
    title, 
    onSubmit 
  }: { 
    show: boolean; 
    onClose: () => void; 
    title: string;
    onSubmit: (e: React.FormEvent) => Promise<void>;
  }) => {
    if (!show) return null;
    
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50">
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full max-h-screen overflow-y-auto m-4">
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="text-lg font-semibold">{title}</h3>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <span className="text-2xl">&times;</span>
            </button>
          </div>
          
          <form onSubmit={onSubmit} className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image URL
                </label>
                <input
                  type="url"
                  name="imageurl"
                  value={formData.imageurl || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="https://example.com/image.jpg"
                />
                {formData.imageurl && (
                  <div className="mt-2">
                    <img 
                      src={formData.imageurl}
                      alt="Scooter Preview"
                      className="h-20 w-20 object-cover rounded-md"
                      onError={(e) => {
                        e.currentTarget.src = "https://via.placeholder.com/150?text=Image+Error";
                      }}
                    />
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Model *
                </label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price per Hour (₹) *
                </label>
                <input
                  type="number"
                  name="priceperhour"
                  value={formData.priceperhour}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Speed *
                </label>
                <input
                  type="text"
                  name="maxspeed"
                  value={formData.maxspeed}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g. 80kmph"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location *
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mileage *
                </label>
                <input
                  type="text"
                  name="mileage"
                  value={formData.mileage}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g. 150km/charge"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Support
                </label>
                <input
                  type="text"
                  name="support"
                  value={formData.support}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g. 24/7 Support"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Owner
                </label>
                <input
                  type="text"
                  name="owner"
                  value={formData.owner}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Available Units *
                </label>
                <input
                  type="number"
                  name="available"
                  value={formData.available}
                  onChange={handleInputChange}
                  min="0"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rating (0-5)
                </label>
                <input
                  type="number"
                  name="rating"
                  value={formData.rating}
                  onChange={handleInputChange}
                  min="0"
                  max="5"
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };
  
  return (
    <>
      {notification.show && (
        <Notification 
          message={notification.message} 
          type={notification.type} 
          onClose={() => setNotification({ ...notification, show: false })}
        />
      )}
      
      {/* Dashboard Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <DashboardCard 
          title="Total Scooters" 
          value={scooters.length} 
          icon="fas fa-motorcycle" 
        />
        <DashboardCard 
          title="Available Scooters" 
          value={scooters.filter(s => s.available >= 1).length} 
          icon="fas fa-check-circle" 
        />
        <DashboardCard 
          title="Unavailable Scooters" 
          value={scooters.filter(s => s.available == 0).length} 
          icon="fas fa-times-circle" 
        />
      </div>
      
      {/* View Scooters Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Scooter Inventory</h2>
          <button 
            onClick={openAddModal}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <i className="fas fa-plus mr-2"></i> Add Scooter
          </button>
        </div>
        
        {loading ? (
          <div className="text-center py-4">
            <p>Loading scooters...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Scooter
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {scooters.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      No scooters found in the inventory.
                    </td>
                  </tr>
                ) : (
                  scooters.map((scooter) => (
                    <tr key={scooter.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            {scooter.imageurl ? (
                              <img
                                src={scooter.imageurl}
                                alt={scooter.name}
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="text-gray-500 text-xs">No img</span>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{scooter.name}</div>
                            <div className="text-sm text-gray-500">{scooter.model}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{scooter.location}</div>
                        <div className="text-sm text-gray-500">
                          Max: {scooter.maxspeed} • Mileage: {scooter.mileage}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">₹{scooter.priceperhour}/hr</div>
                        <div className="text-sm text-gray-500">Rating: {scooter.rating}/5</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span 
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            scooter.available >= 1 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {scooter.available >= 1 ? 'Available' : 'Unavailable'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => openEditModal(scooter)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          <i className="fas fa-edit"></i> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteScooter(scooter.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <i className="fas fa-trash"></i> Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Add Scooter Modal */}
      <ScooterFormModal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Scooter"
        onSubmit={handleAddScooter}
      />
      
      {/* Edit Scooter Modal */}
      <ScooterFormModal
        show={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Scooter"
        onSubmit={handleUpdateScooter}
      />
    </>
  );
};

export default ScooterManagement;