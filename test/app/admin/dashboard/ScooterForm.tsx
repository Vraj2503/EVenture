import React from 'react';
import { Scooter, ScooterFormData} from './ScooterTypes';

type ScooterFormProps = {
  scooterData: ScooterFormData;
  isEditing: boolean;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
};

const ScooterForm: React.FC<ScooterFormProps> = ({
  scooterData,
  isEditing,
  onCancel,
  onSubmit,
  onChange
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-screen overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">
          {isEditing ? 'Edit Scooter' : 'Add New Scooter'}
        </h2>
        
        <form onSubmit={onSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                name="name"
                value={scooterData.name || ''}
                onChange={onChange}
                required
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Model
              </label>
              <input
                type="text"
                name="model"
                value={scooterData.model || ''}
                onChange={onChange}
                required
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image URL
              </label>
              <input
                type="text"
                name="imageUrl"
                value={scooterData.imageurl || ''}
                onChange={onChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price Per Hour (₹)
              </label>
              <input
                type="number"
                name="pricePerHour"
                value={scooterData.priceperhour || 0}
                onChange={onChange}
                required
                step="0.01"
                min="0"
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Speed
              </label>
              <input
                type="text"
                name="maxSpeed"
                value={scooterData.maxspeed || ''}
                onChange={onChange}
                required
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={scooterData.location || ''}
                onChange={onChange}
                required
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mileage
              </label>
              <input
                type="text"
                name="mileage"
                value={scooterData.mileage || ''}
                onChange={onChange}
                required
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Support
              </label>
              <input
                type="text"
                name="support"
                value={scooterData.support || ''}
                onChange={onChange}
                required
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Owner
              </label>
              <input
                type="text"
                name="owner"
                value={scooterData.owner || ''}
                onChange={onChange}
                required
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Available
              </label>
              <select
                name="available"
                value={scooterData.available?.toString() || '1'}
                onChange={onChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="1">Yes</option>
                <option value="0">No</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rating (0-5)
              </label>
              <input
                type="number"
                name="rating"
                value={scooterData.rating || 0}
                onChange={onChange}
                required
                step="0.1"
                min="0"
                max="5"
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {isEditing ? 'Update Scooter' : 'Add Scooter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScooterForm;