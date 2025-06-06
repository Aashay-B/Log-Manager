// src/components/TempRecorderForm.js

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

    const { error } = await supabase.from('temperature_logs').insert([form]);

    if (error) {
      alert('Error: ' + error.message);
    } else {
      alert('Temperature recorded!');
      setForm({ name: '', location: locations[0], temperature: '' });
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto bg-white shadow rounded">
      <h2 className="text-xl font-semibold mb-4 text-center">Temp Recorder</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Your name"
          className="w-full p-2 border rounded"
          required
        />
        <select
          name="location"
          value={form.location}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        >
          {locations.map(loc => (
            <option key={loc} value={loc}>{loc}</option>
          ))}
        </select>
        <input
          name="temperature"
          type="number"
          value={form.temperature}
          onChange={handleChange}
          placeholder="Temperature (°C)"
          className="w-full p-2 border rounded"
          required
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Submit
        </button>
      </form>
    </div>
  );
}
