import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

const departmentOptions = ['Deli', 'Warehouse'];

const cleanedByOptions = {
  Deli: ['','Tamara', 'Jimmy', 'Verna', 'Stephania', 'Navi', 'Sonam'],
  Warehouse: ['','Gagi', 'Tate', 'Kirro']
};

const areaEquipmentOptions = {
  Deli: ['','Floors', 'Detail Cleaning', 'End of Shift Cleaning', 'Grater', 'Meat Slicer 1', 'Meat Slicer 2', 'Cheese Slicer'],
  Warehouse: ['','Floors', 'Racks', 'Detail Cleaning', 'Bins']
};

export default function TaskForm() {
  const [form, setForm] = useState({
    department: 'Deli',
    cleaning_time: '',
    cleaned_by: cleanedByOptions['Deli'][0],
    area_equipment: areaEquipmentOptions['Deli'][0],
    comments: ''
  });

  const handleChange = e => {
    const { name, value } = e.target;

    // When department changes, update cleaned_by and area_equipment defaults
    if (name === 'department') {
      setForm(prev => ({
        ...prev,
        department: value,
        cleaned_by: cleanedByOptions[value][0],
        area_equipment: areaEquipmentOptions[value][0]
      }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();

    const localTime = new Date(form.cleaning_time);
    const utcTime = new Date(localTime.getTime() - localTime.getTimezoneOffset() * 60000).toISOString();

    const taskData = {
      ...form,
      cleaning_time: utcTime
    };

    const { error } = await supabase.from('tasks').insert([taskData]);

    if (error) {
      alert('Error: ' + error.message);
    } else {
      alert('Cleaning log submitted!');
      setForm({
        department: 'Deli',
        cleaning_time: '',
        cleaned_by: cleanedByOptions['Deli'][0],
        area_equipment: areaEquipmentOptions['Deli'][0],
        comments: ''
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 max-w-md mx-auto bg-white shadow rounded">
      <h2 className="text-xl font-semibold mb-6 text-center">Cleaning Log</h2>

      <div className="mb-4">
        <label htmlFor="department" className="block font-medium mb-1">Department</label>
        <select
          id="department"
          name="department"
          value={form.department}
          onChange={handleChange}
          className="w-full p-3 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
        >
          {departmentOptions.map(dep => (
            <option key={dep} value={dep}>{dep}</option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label htmlFor="cleaning_time" className="block font-medium mb-1">Date and Time Cleaned</label>
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
        <label htmlFor="cleaned_by" className="block font-medium mb-1">Cleaned By</label>
        <select
          id="cleaned_by"
          name="cleaned_by"
          value={form.cleaned_by}
          onChange={handleChange}
          className="w-full p-3 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
        >
          {cleanedByOptions[form.department].map(person => (
            <option key={person} value={person}>{person}</option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label htmlFor="area_equipment" className="block font-medium mb-1">Area/Equipment</label>
        <select
          id="area_equipment"
          name="area_equipment"
          value={form.area_equipment}
          onChange={handleChange}
          className="w-full p-3 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
        >
          {areaEquipmentOptions[form.department].map(area => (
            <option key={area} value={area}>{area}</option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label htmlFor="comments" className="block font-medium mb-1">Comments / Notes</label>
        <textarea
          id="comments"
          name="comments"
          value={form.comments}
          onChange={handleChange}
          rows="4"
          className="w-full p-3 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
          placeholder="Optional comments or notes..."
        />
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition"
      >
        Submit Log
      </button>
    </form>
  );
}
