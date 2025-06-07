import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

const departments = ["Meat", "Deli", "General Warehouse"];

export default function TaskForm() {
  const [form, setForm] = useState({
    name: '',
    department: departments[0],
    cleaning_time: '',
    things_cleaned: ''
  });

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

const handleSubmit = async e => {
  e.preventDefault();

  // Convert local datetime string to UTC ISO format
  const localTime = new Date(form.cleaning_time);
  const utcTime = new Date(localTime.getTime() - localTime.getTimezoneOffset() * 60000).toISOString();

  // Prepare the data to send to Supabase
  const taskData = {
    ...form,
    cleaning_time: utcTime,
  };

  const { error } = await supabase.from('tasks').insert([taskData]);

  if (error) {
    alert('Error: ' + error.message);
  } else {
    alert('Task submitted!');
    setForm({
      name: '',
      department: departments[0],
      cleaning_time: '',
      things_cleaned: '',
    });
  }
};


  return (
    <form onSubmit={handleSubmit} className="p-6 max-w-md mx-auto bg-white shadow rounded">
      <h2 className="text-xl font-semibold mb-4 text-center">Task Logger</h2>
      <input
        name="name"
        value={form.name}
        onChange={handleChange}
        placeholder="Your Name"
        className="w-full p-3 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
        required
      />
      <select
        name="department"
        value={form.department}
        onChange={handleChange}
        className="w-full p-3 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
      >
        {departments.map(dep => (
          <option key={dep} value={dep}>{dep}</option>
        ))}
      </select>
      <input
        type="datetime-local"
        name="cleaning_time"
        value={form.cleaning_time}
        onChange={handleChange}
        className="w-full p-3 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
        required
      />
      <textarea
        name="things_cleaned"
        value={form.things_cleaned}
        onChange={handleChange}
        placeholder="Things cleaned..."
        rows="4"
        className="w-full p-3 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
        required
      />
      <button
        type="submit"
        className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition"
      >
        Submit Task
      </button>
    </form>
  );
}
