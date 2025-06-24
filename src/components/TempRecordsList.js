// src/components/TempRecordsList.js
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { format } from 'date-fns-tz';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const LOCATIONS = [
  'All Locations',
  'Big Freezer',
  'Big Meat Cooler',
  'Deli Cooler',
  'Deli Refrigerator 1',
  'Deli Refrigerator 2',
  'Deli Refrigerator 3',
  'Deli Refrigerator 4',
  'Deli Refrigerator 5',
  'Deli Room',
  'Dry Aging Room',
  'Meat Cutting Room',
  'Small Freezer',
  'Small Meat Cooler'
];

// function formatToPST(dt) {
//   return format(new Date(dt), 'yyyy-MM-dd hh:mm aaaa zzz', { timeZone: 'America/Los_Angeles' });
// }
function formatDateOnlyWithDaytime(dt) {
  return format(new Date(dt), 'EEEE, yyyy-MM-dd hh:mm aaaa');
}
function formatDateOnly(dt) {
  return format(new Date(dt), 'yyyy-MM-dd');
}

function RecordTable({ records }) {
  return (
    <div className="overflow-x-auto mt-2 mb-6">
      <table className="w-full text-sm border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="text-left px-4 py-2 border">Time</th>
            <th className="text-left px-4 py-2 border">Temperature</th>
          </tr>
        </thead>
        <tbody>
          {records.map(record => {
            const loc = record.location.toLowerCase();
            const isFridge = loc.includes('refrigerator') || loc.includes('cooler');
            const isFreezer = loc.includes('freezer');
            const isCritical = () => {
              if (record.unit === 'C') {
                return (isFridge && record.temperature > 4) || (isFreezer && record.temperature > -18);
              } else if (record.unit === 'F') {
                return (isFridge && record.temperature > 39.2) || (isFreezer && record.temperature > -0.4);
              }
              return false;
            };
            const critical = isCritical();
            return (
              <tr key={record.id} className={critical ? 'bg-red-100 text-red-700' : ''}>
                <td className="px-4 py-2 border">{formatDateOnlyWithDaytime(record.recorded_at)}</td>
                <td className="px-4 py-2 border">
                  {record.temperature === 'DEFROST'
                    ? 'DEFROST'
                    : `${record.temperature}°${record.unit}`}
                </td>

              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ExportModal({
  isOpen, onClose, onExport,
  location, setLocation,
  startDate, setStartDate,
  endDate, setEndDate,
  todayStr,
  exportType,
  setExportType
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
        <h2 className="text-xl font-semibold mb-4 text-center">Export Records</h2>
        <div className="space-y-4">
          <div>
            <label className="block mb-1 text-sm text-gray-700">Location</label>
            <select value={location} onChange={e => setLocation(e.target.value)} className="w-full px-3 py-2 border rounded">
              {LOCATIONS.map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="block mb-1 text-sm text-gray-700">Start Date</label>
            <input type="date" max={todayStr} value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-3 py-2 border rounded" />
          </div>
          <div>
            <label className="block mb-1 text-sm text-gray-700">End Date</label>
            <input type="date" max={todayStr} value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-3 py-2 border rounded" />
          </div>
          <div>
            <label className="block mb-1 text-sm text-gray-700">Export Format</label>
            <select value={exportType} onChange={e => setExportType(e.target.value)} className="w-full px-3 py-2 border rounded">
              <option value="pdf">PDF</option>
              <option value="xlsx">Excel (.xlsx)</option>
            </select>
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Cancel</button>
          <button onClick={onExport} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Export</button>
        </div>
      </div>
    </div>
  );
}

export default function TempRecordsList() {
  const [records, setRecords] = useState([]);
  const [locFilter, setLocFilter] = useState('All Locations');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showExport, setShowExport] = useState(false);
  const [expLoc, setExpLoc] = useState('All Locations');
  const [expStart, setExpStart] = useState('');
  const [expEnd, setExpEnd] = useState('');
  const [exportType, setExportType] = useState('pdf');
  const [openLocations, setOpenLocations] = useState({});
  const [allExpanded, setAllExpanded] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);

  useEffect(() => {
    setStartDate(firstOfMonth);
    setEndDate(today);
    fetchRecords();
  }, []);

  async function fetchRecords() {
    const { data, error } = await supabase.from('temp_records').select('*').order('recorded_at', { ascending: false });
    if (error) console.error(error);
    else setRecords(data);
  }

  const filtered = records.filter(r => {
    const mLoc = locFilter === 'All Locations' || r.location === locFilter;
    const d = new Date(r.recorded_at);
    const mStart = startDate ? d >= new Date(startDate) : true;
    const mEnd = endDate ? d <= new Date(endDate + 'T23:59:59') : true;
    return mLoc && mStart && mEnd;
  });

  // Group and sort location keys alphabetically
  const filteredByLocation = {};
  filtered.forEach(r => {
    if (!filteredByLocation[r.location]) filteredByLocation[r.location] = [];
    filteredByLocation[r.location].push(r);
  });

  const sortedLocations = Object.keys(filteredByLocation).sort();

  const reset = () => {
    setLocFilter('All Locations');
    setStartDate(firstOfMonth);
    setEndDate(today);
  };

  const handleExpandCollapseAll = () => {
    const newOpenState = {};
    if (!allExpanded) {
      sortedLocations.forEach(loc => newOpenState[loc] = true);
    }
    setOpenLocations(newOpenState);
    setAllExpanded(!allExpanded);
  };

  // PDF export
  const handleExportPDF = () => {
    const doc = new jsPDF();
    const logo = new Image();
    logo.src = `${window.location.origin}/Logo.jpg`;

    logo.onload = () => {
      function header() {
        doc.addImage(logo, 'PNG', 10, 6, 40, 20);
        doc.setFontSize(14);
        doc.text('Temperature Records Export', 105, 15, { align: 'center' });
        const rTxt = `${expStart ? `From: ${formatDateOnly(expStart)}` : ''}${expEnd ? ` To: ${formatDateOnly(expEnd)}` : ''}`;
        doc.setFontSize(10);
        doc.text(rTxt, 105, 23, { align: 'center' });
      }

      const toExport = records.filter(r => {
        const mLoc = expLoc === 'All Locations' || r.location === expLoc;
        const d = new Date(r.recorded_at);
        const mStart = expStart ? d >= new Date(expStart) : true;
        const mEnd = expEnd ? d <= new Date(expEnd + 'T23:59:59') : true;
        return mLoc && mStart && mEnd;
      });

      const byLocation = {};
      toExport.forEach(r => {
        if (!byLocation[r.location]) byLocation[r.location] = [];
        byLocation[r.location].push(r);
      });

      let first = true;
      Object.entries(byLocation).forEach(([loc, recs]) => {
        if (!first) doc.addPage();
        first = false;

        header();

        let y = 40;
        doc.setFontSize(14);
        doc.text(loc, 14, y);
        y += 8;

        autoTable(doc, {
          startY: y,
          head: [['Recorded At', 'Name', 'Temperature']],
          body: recs.map(r => [
            formatDateOnlyWithDaytime(r.recorded_at),
            r.name,
            r.temperature === 'DEFROST' ? 'DEFROST' : `${r.temperature}°${r.unit}`
          ]),
          styles: { fontSize: 9 },
          theme: 'grid',
          headStyles: { fillColor: [41, 128, 185] },
          margin: { left: 14, right: 14 }
        });
      });

      const d = new Date();
      const fn = `Temp_Records_${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}.pdf`;
      doc.save(fn);
    };
  };

  // XLSX export
  const handleExportXLSX = () => {
  const toExport = records.filter(r => {
    const mLoc = expLoc === 'All Locations' || r.location === expLoc;
    const d = new Date(r.recorded_at);
    const mStart = expStart ? d >= new Date(expStart) : true;
    const mEnd = expEnd ? d <= new Date(endDate + 'T23:59:59') : true;
    return mLoc && mStart && mEnd;
  });

  toExport.sort((a, b) => {
    if (a.location < b.location) return -1;
    if (a.location > b.location) return 1;
    return new Date(a.recorded_at) - new Date(b.recorded_at);
  });

  const wsData = [
    ['Location', 'Date and Time', 'Temperature']
  ];

  toExport.forEach(r => {
    wsData.push([
      r.location,
      formatDateOnlyWithDaytime(r.recorded_at), // <-- include day name here
      `${r.temperature}°${r.unit}`
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Temperature Records');

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/octet-stream' });
  saveAs(blob, `Temp_Records_${new Date().toISOString().slice(0,10)}.xlsx`);
};


  const handleExport = () => {
    if (exportType === 'pdf') {
      handleExportPDF();
    } else if (exportType === 'xlsx') {
      handleExportXLSX();
    }
    setShowExport(false);
  };

  return (
    <div className="max-w-5xl mx-auto p-4 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4 text-center">Temperature Records</h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <select value={locFilter} onChange={e => setLocFilter(e.target.value)} className="px-4 py-2 border rounded">
          {LOCATIONS.map(l => <option key={l}>{l}</option>)}
        </select>
        <input type="date" max={today} value={startDate} onChange={e => setStartDate(e.target.value)} className="px-4 py-2 border rounded" />
        <input type="date" max={today} value={endDate} onChange={e => setEndDate(e.target.value)} className="px-4 py-2 border rounded" />
        <button onClick={reset} className="bg-gray-300 px-4 py-2 rounded">Reset Filters</button>
      </div>

      <div className="flex justify-between items-center mb-6">
        <button
          onClick={handleExpandCollapseAll}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          {allExpanded ? 'Collapse All' : 'Expand All'}
        </button>
        <button
          onClick={() => {
            setExpLoc(locFilter);
            setExpStart(startDate);
            setExpEnd(endDate);
            setShowExport(true);
          }}
          className="bg-red-600 text-white px-4 py-2 rounded"
        >
          Export
        </button>
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-600">No temperature records found for selected filters.</p>
      ) : (
        sortedLocations.map(loc => {
          const recs = filteredByLocation[loc];
          const isOpen = openLocations[loc];
          return (
            <div key={loc} className="mb-6 border rounded">
              <div
                onClick={() =>
                  setOpenLocations(prev => ({
                    ...prev,
                    [loc]: !prev[loc]
                  }))
                }
                className="p-3 bg-gray-100 cursor-pointer flex justify-between items-center"
              >
                <h4 className="text-lg font-semibold text-gray-700">
                  {loc} <span className="text-sm text-gray-500">({recs.length} record{recs.length !== 1 ? 's' : ''})</span>
                </h4>
                <span className="text-blue-500 text-sm">{isOpen ? '▲ Hide' : '▼ Show'}</span>
              </div>
              {isOpen && <RecordTable records={recs} />}
            </div>
          );
        })
      )}

      {showExport && (
        <ExportModal
          isOpen
          onClose={() => setShowExport(false)}
          onExport={handleExport}
          location={expLoc}
          setLocation={setExpLoc}
          startDate={expStart}
          setStartDate={setExpStart}
          endDate={expEnd}
          setEndDate={setExpEnd}
          todayStr={today}
          exportType={exportType}
          setExportType={setExportType}
        />
      )}
    </div>
  );
}
