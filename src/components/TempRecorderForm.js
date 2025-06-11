import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

const locations = ['Fridge 1', 'Fridge 2', 'Fridge 3', 'Freezer 1', 'Freezer 2', 'Freezer 3', 'Dry Age Room'];

export default function TempRecorderForm() {
  const [form, setForm] = useState({ name: '', location: locations[0], temperature: '' });

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { error } = await supabase.from('temp_records').insert([form]);

    if (error) {
      alert('Error: ' + error.message);
    } else {
      alert('Temperature recorded!');
      setForm({ name: '', location: locations[0], temperature: '' });
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white shadow rounded">
      <h2 className="text-xl font-semibold mb-6 text-center">Temperature Recorder</h2>
      <form onSubmit={handleSubmit} className="space-y-4">

        <div>
          <label htmlFor="name" className="block font-medium mb-1">Your Name</label>
          <input
            id="name"
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
            required
          />
        </div>

        <div>
          <label htmlFor="location" className="block font-medium mb-1">Location</label>
          <select
            id="location"
            name="location"
            value={form.location}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
          >
            {locations.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="temperature" className="block font-medium mb-1">Temperature (°C)</label>
          <input
            id="temperature"
            name="temperature"
            type="number"
            value={form.temperature}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
            placeholder="Enter temperature in °C"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition"
        >
          Submit
        </button>
      </form>
    </div>
  );
}
