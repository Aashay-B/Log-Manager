import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { format } from 'date-fns-tz';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const LOCATIONS = [
  'All Locations',
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

// Format date string as-is (assumed to be already PST), no timezone conversion
function formatToPST(dateString) {
  const date = new Date(dateString);
  return format(date, 'yyyy-MM-dd hh:mm aaaa zzz', { timeZone: "PST" });
}

function formatDateOnly(dateString) {
  const date = new Date(dateString);
  return format(date, 'yyyy-MM-dd');  // removed timeZone option
}

function Disclosure({ record }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className="bg-gray-50 border rounded p-3 shadow-sm cursor-pointer hover:bg-gray-100 transition"
      onClick={() => setIsOpen(!isOpen)}
    >
      <div className="flex justify-between items-center">
        <div>
          <span className="text-sm font-medium text-gray-700">{formatToPST(record.recorded_at)}</span>
          <span className="ml-2 text-gray-600">— {record.name}</span>
        </div>
        <span className="text-xs text-blue-600">{isOpen ? 'Hide' : 'Details'}</span>
      </div>

      {isOpen && (
        <div className="mt-3 text-sm text-gray-700 space-y-1">
          <div><strong>Location:</strong> {record.location}</div>
          <div><strong>Name:</strong> {record.name}</div>
          <div><strong>Temperature:</strong> {record.temperature}°{record.unit}</div>
          <div><strong>Recorded At:</strong> {formatToPST(record.recorded_at)}</div>
        </div>
      )}
    </div>
  );
}

function ExportModal({
  isOpen,
  onClose,
  onExport,
  location,
  setLocation,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  todayStr,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
        <h2 className="text-xl font-semibold mb-4 text-center">Export to PDF</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="border px-3 py-2 rounded w-full"
            >
              {LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              max={todayStr}
              className="border px-3 py-2 rounded w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              max={todayStr}
              className="border px-3 py-2 rounded w-full"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={onExport}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Export
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TempRecordsList() {
  const [records, setRecords] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('All Locations');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportLocation, setExportLocation] = useState('All Locations');
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');

  const todayStr = new Date().toISOString().slice(0, 10);
  const firstOfMonthStr = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .slice(0, 10);

  useEffect(() => {
    setStartDate(firstOfMonthStr);
    setEndDate(todayStr);
    fetchRecords();
  }, []);

  async function fetchRecords() {
    const { data, error } = await supabase
      .from('temp_records')
      .select('*')
      .order('recorded_at', { ascending: false });

    if (error) {
      console.error('Error fetching temperature records:', error.message);
    } else {
      setRecords(data);
    }
  }

  const filteredRecords = records.filter((record) => {
    const matchLocation = selectedLocation === 'All Locations' || record.location === selectedLocation;

    const recordDate = new Date(record.recorded_at);
    const matchStart = startDate ? recordDate >= new Date(startDate) : true;
    const matchEnd = endDate ? recordDate <= new Date(endDate + 'T23:59:59') : true;

    return matchLocation && matchStart && matchEnd;
  });

  const resetFilters = () => {
    setSelectedLocation('All Locations');
    setStartDate(firstOfMonthStr);
    setEndDate(todayStr);
  };

  const handleExportPDF = async () => {
    const doc = new jsPDF();
    const logo = new Image();
    logo.src = `${window.location.origin}/logo.png`;
    await new Promise((resolve) => (logo.onload = resolve));
    doc.addImage(logo, 'PNG', 7, 0, 50, 40);

    doc.setFontSize(14);
    doc.text('Temperature Records Export', 105, 20, { align: 'center' });

    const rangeText =
      (exportStartDate ? `From: ${formatDateOnly(exportStartDate)}` : '') +
      (exportEndDate ? ` To: ${formatDateOnly(exportEndDate)}` : '');

    doc.setFontSize(10);
    doc.text(rangeText, 105, 28, { align: 'center' });

    let yOffset = 40;

    const exportFilteredRecords = records.filter((record) => {
      const matchLocation = exportLocation === 'All Locations' || record.location === exportLocation;
      const recordDate = new Date(record.recorded_at);
      const matchStart = exportStartDate ? recordDate >= new Date(exportStartDate) : true;
      const matchEnd = exportEndDate ? recordDate <= new Date(exportEndDate + 'T23:59:59') : true;
      return matchLocation && matchStart && matchEnd;
    });

    const groupedRecords = {};
    exportFilteredRecords.forEach((record) => {
      if (!groupedRecords[record.location]) {
        groupedRecords[record.location] = [];
      }
      groupedRecords[record.location].push(record);
    });

    for (const loc of Object.keys(groupedRecords)) {
      const locRecords = groupedRecords[loc];

      if (yOffset > 250) {
        doc.addPage();
        yOffset = 20;
      }

      doc.setFontSize(12);
      doc.text(loc + ' Location', 14, yOffset);
      yOffset += 6;

      autoTable(doc, {
        startY: yOffset,
        head: [['Recorded At', 'Name', 'Temperature']],
        body: locRecords.map((record) => [
          formatToPST(record.recorded_at),
          record.name,
          `${record.temperature}°${record.unit}`,
        ]),
        styles: { fontSize: 9 },
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
        margin: { left: 14, right: 14 },
        didDrawPage: (data) => {
          yOffset = data.cursor.y + 10;
        },
      });
    }

    doc.save('temperature_records_by_location.pdf');
  };

  return (
    <div className="max-w-3xl mx-auto p-4 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4 text-center">Temperature Records</h2>

      {/* Filter Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">Filter by Location</label>
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="px-4 py-2 border rounded w-full"
          >
            {LOCATIONS.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            max={todayStr}
            className="px-4 py-2 border rounded w-full"
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            max={todayStr}
            className="px-4 py-2 border rounded w-full"
          />
        </div>

        <div className="flex items-end">
          <button
            onClick={resetFilters}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded w-full"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Export Button */}
      <div className="mb-4 text-right">
        <button
          onClick={() => {
            setExportLocation(selectedLocation);
            setExportStartDate(startDate);
            setExportEndDate(endDate);
            setShowExportModal(true);
          }}
          className="bg-red-600 text-white px-4 py-2 rounded shadow hover:bg-red-700"
        >
          Export to PDF
        </button>
      </div>

      {/* Export Modal Popup */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={() => {
          handleExportPDF();
          setShowExportModal(false);
        }}
        location={exportLocation}
        setLocation={setExportLocation}
        startDate={exportStartDate}
        setStartDate={setExportStartDate}
        endDate={exportEndDate}
        setEndDate={setExportEndDate}
        todayStr={todayStr}
      />

      {/* Records List */}
      {filteredRecords.length === 0 ? (
        <p className="text-gray-600">No temperature records found for selected filters.</p>
      ) : (
        LOCATIONS.filter((loc) => loc !== 'All Locations').map((loc) => {
          const locRecords = filteredRecords.filter((rec) => rec.location === loc);
          if (locRecords.length === 0) return null;

          return (
            <div key={loc} className="mb-6">
              <h3 className="text-lg font-semibold mb-2 border-b pb-1">{loc} Records</h3>
              {locRecords.map((record) => (
                <Disclosure key={record.id} record={record} />
              ))}
            </div>
          );
        })
      )}
    </div>
  );
}
