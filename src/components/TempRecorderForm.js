import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';

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
  const [name, setName] = useState('Lavinder Deol');

  function getLocalDateTimeString() {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const localDate = new Date(now.getTime() - offset * 60000);
    return localDate.toISOString().slice(0, 16);
  }

  const [recordedAt, setRecordedAt] = useState(getLocalDateTimeString());

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
      const value = data.value.trim();

      if (value !== '') {
        if (value.toUpperCase() === 'DEF') {
          recordsToSubmit.push({
            name,
            location,
            temperature: "DEFROST",
            unit: null,
            recorded_at: new Date(recordedAt).toISOString(),
          });
        } else if (!isNaN(parseFloat(value))) {
          recordsToSubmit.push({
            name,
            location,
            temperature: parseFloat(value),
            unit: data.unit,
            recorded_at: new Date(recordedAt).toISOString(),
          });
        } else {
          toast.error(`Invalid input for ${location}. Please enter a number or "DEF".`);
          return;
        }
      }
    }

    if (recordsToSubmit.length === 0) {
      toast.error('Please enter at least one temperature or DEF.');
      return;
    }

    const { error } = await supabase.from('temp_records').insert(recordsToSubmit);

    if (error) {
      toast.error(`Error: ${error.message}`);
    } else {
      toast.success('Temperature(s) recorded!');
      setName('');
      setRecordedAt(getLocalDateTimeString());
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
          />
        </div>

        <div>
          <label className="block font-medium mb-2">Date & Time Recorded</label>
          <input
            type="datetime-local"
            value={recordedAt}
            onChange={(e) => setRecordedAt(e.target.value)}
            required
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
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
                      disabled={temps[loc].value.trim().toUpperCase() === 'DEF'}
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
