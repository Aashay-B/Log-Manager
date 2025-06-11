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

    const localTime = new Date(form.cleaning_time);
    const utcTime = new Date(localTime.getTime() - localTime.getTimezoneOffset() * 60000).toISOString();

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
      <h2 className="text-xl font-semibold mb-6 text-center">Task Logger</h2>

      <div className="mb-4">
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

      <div className="mb-4">
        <label htmlFor="department" className="block font-medium mb-1">Department</label>
        <select
          id="department"
          name="department"
          value={form.department}
          onChange={handleChange}
          className="w-full p-3 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
        >
          {departments.map(dep => (
            <option key={dep} value={dep}>{dep}</option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label htmlFor="cleaning_time" className="block font-medium mb-1">Cleaning Time</label>
        <input
          id="cleaning_time"
          type="datetime-local"
          name="cleaning_time"
          value={form.cleaning_time}
          onChange={handleChange}
          className="w-full p-3 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
          required
        />
      </div>

      <div className="mb-4">
        <label htmlFor="things_cleaned" className="block font-medium mb-1">Things Cleaned</label>
        <textarea
          id="things_cleaned"
          name="things_cleaned"
          value={form.things_cleaned}
          onChange={handleChange}
          rows="4"
          className="w-full p-3 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
          placeholder="E.g., shelves, floor, counters"
          required
        />
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition"
      >
        Submit Task
      </button>
    </form>
  );
}
