import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { format } from 'date-fns-tz';

const PST_TIMEZONE = 'America/Los_Angeles';

function formatToPST(dateString) {
  const date = new Date(dateString);
  return format(date, 'yyyy-MM-dd hh:mm aaaa zzz', { timeZone: PST_TIMEZONE });
}

export default function TempRecordsList() {
  const [records, setRecords] = useState([]);

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

  return (
    <div className="max-w-3xl mx-auto p-4 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4 text-center">Temperature Records</h2>

      {records.length === 0 ? (
        <p className="text-gray-600 text-center">No temperature records found.</p>
      ) : (
        <div className="space-y-4">
          {records.map(record => (
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
