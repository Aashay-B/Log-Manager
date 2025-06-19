import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

const locations = [
  'Deli Refrigerator 1',
  'Deli Refrigerator 2',
  'Deli Refrigerator 3',
  'Deli Refrigerator 4',
  'Deli Refrigerator 5',
  'Deli Room',
  'Small Meat Cooler',
  'Deli Cooler',
  'Dry Aging Room',
  'Small Freezer',
  'Big Freezer',
  'Big Meat Cooler',
  'Meat Cutting Room',
];

export default function TempRecorderForm() {
  const [name, setName] = useState('');
  const [temps, setTemps] = useState(
    locations.reduce((acc, loc) => {
      acc[loc] = { value: '', unit: 'C' };
      return acc;
    }, {})
  );

  const toggleUnit = (location) => {
    setTemps(prev => {
      const current = prev[location];
      const newUnit = current.unit === 'C' ? 'F' : 'C';
      let newValue = current.value;

      if (!isNaN(parseFloat(current.value))) {
        newValue =
          newUnit === 'F'
            ? (parseFloat(current.value) * 9 / 5 + 32).toFixed(1)
            : ((parseFloat(current.value) - 32) * 5 / 9).toFixed(1);
      }

      return {
        ...prev,
        [location]: {
          value: newValue,
          unit: newUnit,
        },
      };
    });
  };

  const handleChange = (location, value) => {
    setTemps(prev => ({
      ...prev,
      [location]: {
        ...prev[location],
        value,
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const recordsToSubmit = [];

    for (const [location, data] of Object.entries(temps)) {
      if (data.value !== '') {
        const temperature =
          data.unit === 'C' ? parseFloat(data.value) : ((parseFloat(data.value) - 32) * 5 / 9).toFixed(1);

        recordsToSubmit.push({
          name,
          location,
          temperature,
        });
      }
    }

    if (recordsToSubmit.length === 0) {
      alert('Please enter at least one temperature.');
      return;
    }

    const { error } = await supabase.from('temp_records').insert(recordsToSubmit);

    if (error) {
      alert('Error: ' + error.message);
    } else {
      alert('Temperature(s) recorded!');
      setName('');
      setTemps(
        locations.reduce((acc, loc) => {
          acc[loc] = { value: '', unit: 'C' };
          return acc;
        }, {})
      );
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto bg-white shadow rounded">
      <h2 className="text-xl font-semibold mb-6 text-center">Temperature Recorder</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block font-medium mb-2">Your Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
            placeholder="Enter your name"
          />
        </div>

        {locations.map(loc => (
          <div key={loc} className="bg-gray-50 border rounded-lg p-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-gray-800 font-medium">{loc}</div>

              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={temps[loc].value}
                  onChange={(e) => handleChange(loc, e.target.value)}
                  className="p-2 border rounded w-28 text-center"
                  placeholder={`°${temps[loc].unit}`}
                />

                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-600">°C</span>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={temps[loc].unit === 'F'}
                      onChange={() => toggleUnit(loc)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer dark:bg-gray-400 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>

                  <span className="text-sm font-medium text-gray-600">°F</span>
                </div>
              </div>
            </div>
          </div>
        ))}

        <button
          type="submit"
          className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition"
        >
          Submit Temperatures
        </button>
      </form>
    </div>
  );
}
