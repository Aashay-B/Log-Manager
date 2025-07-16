import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { fromZonedTime } from 'date-fns-tz';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const PST_TIMEZONE = 'America/Los_Angeles';

const departmentOptions = ['Deli', 'Warehouse'];

const cleanedByOptions = {
  Deli: ['', 'Tamara', 'Jimmy', 'Berna', 'Stefania', 'Navi', 'Sonam', 'Stephanie'],
  Warehouse: ['', 'Gagi', 'Tate', 'Kirro']
};

const areaEquipmentOptions = {
  Deli: ['', 'New Shift Dry Cleaning','Meat Slicer 1', 'Meat Slicer 2', 'Cheese Slicer', 'Grater', 'End of Shift Cleaning', 'Weekly Cleaning'],
  Warehouse: ['','Detail Cleaning', 'End of Shift Cleaning']
};

function getLocalDateTimeString() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const localDate = new Date(now.getTime() - offset * 60000);
  return localDate.toISOString().slice(0, 16);
}

export default function TaskForm() {
  const [form, setForm] = useState({
    department: 'Deli',
    cleaning_time: getLocalDateTimeString(),
    cleaned_by: cleanedByOptions['Deli'][0],
    area_equipment: areaEquipmentOptions['Deli'][0],
    comments: ''
  });

  const [cleaningType, setCleaningType] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'department') {
      setForm((prev) => ({
        ...prev,
        department: value,
        cleaned_by: cleanedByOptions[value][0],
        area_equipment: areaEquipmentOptions[value][0]
      }));
    } else if (name === 'area_equipment') {
      setForm((prev) => ({ ...prev, [name]: value }));
      setCleaningType(''); // reset cleaning type if area changes
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const showToast = (message, type = 'success') => {
    toast[type](message, {
      className: 'custom-toast',
      bodyClassName: 'custom-toast-body',
      closeButton: false,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const requiresCleaningType = ['Meat Slicer 1', 'Meat Slicer 2', 'Cheese Slicer'].includes(form.area_equipment);

    if (!form.cleaned_by || form.cleaned_by.trim() === '') {
      showToast('Please select who cleaned it.', 'error');
      return;
    }

    if (!form.area_equipment || form.area_equipment.trim() === '') {
      showToast('Please select an area or equipment.', 'error');
      return;
    }

    if (requiresCleaningType && !cleaningType) {
      showToast('Please select a cleaning type.', 'error');
      return;
    }

    try {
      const localDate = new Date(form.cleaning_time);
      const pstDate = fromZonedTime(localDate, PST_TIMEZONE);

      const taskData = {
        ...form,
        cleaning_type: requiresCleaningType ? cleaningType : '',
        cleaning_time: pstDate.toISOString()
      };

      const { error } = await supabase.from('tasks').insert([taskData]);

      if (error) {
        showToast('Error: ' + error.message, 'error');
      } else {
        showToast('Cleaning log submitted successfully!');
        setForm({
          department: 'Deli',
          cleaning_time: getLocalDateTimeString(),
          cleaned_by: cleanedByOptions['Deli'][0],
          area_equipment: areaEquipmentOptions['Deli'][0],
          comments: ''
        });
        setCleaningType('');
      }
    } catch (err) {
      console.error('Time conversion error:', err);
      showToast('Error converting time. Please check your input.', 'error');
    }
  };

  const requiresCleaningType = ['Meat Slicer 1', 'Meat Slicer 2', 'Cheese Slicer'].includes(form.area_equipment);

  return (
    <>
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
            {departmentOptions.map((dep) => (
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
            {cleanedByOptions[form.department].map((person) => (
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
            {areaEquipmentOptions[form.department].map((area) => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>
        </div>

        {requiresCleaningType && (
          <div className="mb-4">
            <label className="block font-medium mb-2 text-gray-700">Cleaning Type</label>
            <div className="flex flex-col space-y-3">
              {['Dry Cleaning/Sanitization', 'Detailed Cleaning'].map((type) => (
                <label
                  key={type}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition ${
                    cleaningType === type
                      ? 'bg-blue-50 border-blue-500 text-blue-700 font-semibold'
                      : 'bg-white border-gray-300 hover:border-blue-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="cleaning_type"
                    value={type}
                    checked={cleaningType === type}
                    onChange={(e) => setCleaningType(e.target.value)}
                    className="form-radio text-blue-600 h-4 w-4 mr-3"
                  />
                  {type}
                </label>
              ))}
            </div>
          </div>
        )}

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

      <ToastContainer
        position="top-center"
        autoClose={3500}
        hideProgressBar
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        toastClassName="custom-toast"
        bodyClassName="custom-toast-body"
        className="toast-container"
      />

      <style jsx="true">{`
        .custom-toast {
          font-size: 1.25rem;
          padding: 30px 24px;
          border-radius: 12px;
          background-color: #1e293b !important;
          color: #fff !important;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
        }

        .custom-toast-body {
          font-weight: 500;
          line-height: 1.4;
        }

        .toast-container {
          z-index: 9999 !important;
          position: fixed !important;
        }
      `}</style>
    </>
  );
}
