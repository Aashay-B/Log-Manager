import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { format } from 'date-fns-tz';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const PST_TIMEZONE = 'America/Los_Angeles';

function formatToPST(dateString) {
  const date = new Date(dateString);
  return format(date, 'yyyy-MM-dd hh:mm aaaa zzz', { timeZone: PST_TIMEZONE });
}

const LOCATIONS = [
  'All Locations',
  'Fridge 1',
  'Fridge 2',
  'Fridge 3',
  'Freezer 1',
  'Freezer 2',
  'Freezer 3',
  'Dry Age Room',
];

export default function TempRecordsList() {
  const [records, setRecords] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('All Locations');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    const { data, error } = await supabase
      .from('temp_records')
      .select('*')
      .order('recorded_at', { ascending: false });

    if (error) {
      console.error('Error fetching temperature records:', error.message);
    } else {
      setRecords(data);
    }
  };

  const filteredRecords = records.filter(record => {
    const matchLocation =
      selectedLocation === 'All Locations' || record.location === selectedLocation;

    const recordDate = new Date(record.recorded_at);
    const matchStart = startDate ? recordDate >= new Date(startDate) : true;
    const matchEnd = endDate ? recordDate <= new Date(endDate + 'T23:59:59') : true;

    return matchLocation && matchStart && matchEnd;
  });

  const exportToPDF = () => {
    const doc = new jsPDF();

    doc.text('Temperature Records', 14, 16);

    const tableData = filteredRecords.map(record => [
      record.name,
      record.location,
      `${record.temperature_c}°C`,
      formatToPST(record.recorded_at),
    ]);

    autoTable(doc, {
      startY: 20,
      head: [['Name', 'Location', 'Temperature (°C)', 'Recorded At (PST)']],
      body: tableData,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [22, 160, 133] },
    });

    doc.save('temperature_records.pdf');
  };

  return (
    <div className="max-w-3xl mx-auto p-4 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4 text-center">Temperature Records</h2>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <select
            value={selectedLocation}
            onChange={e => setSelectedLocation(e.target.value)}
            className="border px-3 py-2 rounded w-full"
          >
            {LOCATIONS.map(loc => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="border px-3 py-2 rounded w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="border px-3 py-2 rounded w-full"
          />
        </div>
      </div>

      {/* Export Button */}
      <div className="mb-4 text-right">
        <button
          onClick={exportToPDF}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Export to PDF
        </button>
      </div>

      {/* Records */}
      {filteredRecords.length === 0 ? (
        <p className="text-gray-600 text-center">No temperature records found.</p>
      ) : (
        <div className="space-y-4">
          {filteredRecords.map(record => (
            <div
              key={record.id}
              className="border border-gray-200 rounded p-4 bg-gray-50 shadow-sm"
            >
              <div className="font-bold text-gray-800">{record.name}</div>
              <div className="text-sm text-gray-600">{record.location}</div>
              <div className="text-sm text-gray-600">
                Temp: <span className="font-semibold">{record.temperature_c}°C</span>
              </div>
              <div className="text-sm text-gray-500">{formatToPST(record.recorded_at)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
