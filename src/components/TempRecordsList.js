// src/components/TempRecordsList.js
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

function formatToPST(dt) {
  return format(new Date(dt), 'yyyy-MM-dd hh:mm aaaa zzz', { timeZone: 'America/Los_Angeles' });
}
function formatDateOnlyWithDay(dt) {
  return format(new Date(dt), 'EEEE, yyyy-MM-dd');
}
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
            {/* <th className="text-left px-4 py-2 border">Name</th> */}
            <th className="text-left px-4 py-2 border">Temperature</th>
            {/* <th className="text-left px-4 py-2 border">Unit</th> */}
          </tr>
        </thead>
        <tbody>
          {records.map(record => {
            const loc = record.location.toLowerCase();
            const isFridge = loc.includes('refrigerator') || loc.includes('cooler');
            const isFreezer = loc.includes('freezer');
            const isCritical = () => {
              if (record.unit === 'C') {
                return (isFridge && record.temperature > 4) || (isFreezer && record.temperature > -16);
              } else if (record.unit === 'F') {
                return (isFridge && record.temperature > 39.2) || (isFreezer && record.temperature > -0.4);
              }
              return false;
            };
            const critical = isCritical();
            return (
              <tr
                key={record.id}
                className={critical ? 'bg-red-100 text-red-700' : ''}
              >
                <td className="px-4 py-2 border">{formatDateOnlyWithDaytime(record.recorded_at)}</td>
                {/* <td className="px-4 py-2 border">{record.name}</td> */}
                <td className="px-4 py-2 border">{record.temperature}°{record.unit}</td>
                {/* <td className="px-4 py-2 border">°{record.unit}</td> */}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ExportModal({ isOpen, onClose, onExport, location, setLocation, startDate, setStartDate, endDate, setEndDate, todayStr }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
        <h2 className="text-xl font-semibold mb-4 text-center">Export to PDF</h2>
        <div className="space-y-4">
          <div>
            <label className="block mb-1 text-sm text-gray-700">Location</label>
            <select value={location} onChange={e => setLocation(e.target.value)} className="w-full px-3 py-2 border rounded">
              {LOCATIONS.map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="block mb-1 text-sm text-gray-700">Start Date</label>
            <input type="date" max={todayStr} value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-3 py-2 border rounded"/>
          </div>
          <div>
            <label className="block mb-1 text-sm text-gray-700">End Date</label>
            <input type="date" max={todayStr} value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-3 py-2 border rounded"/>
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
  const [openLocations, setOpenLocations] = useState({});

  const today = new Date().toISOString().slice(0,10);
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0,10);

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

  const reset = () => {
    setLocFilter('All Locations');
    setStartDate(firstOfMonth);
    setEndDate(today);
  };

  const toggleLocation = (date, location) => {
    setOpenLocations(prev => ({
      ...prev,
      [date]: {
        ...prev[date],
        [location]: !prev[date]?.[location]
      }
    }));
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const logo = new Image();
    logo.src = `${window.location.origin}/Logo.jpg`;

    logo.onload = () => {
      function header() {
        doc.addImage(logo, 'PNG', 7, 7, 40, 20);
        doc.setFontSize(14);
        doc.text('Temperature Records Export', 105, 20, { align: 'center' });
        const rTxt = `${expStart ? `From: ${formatDateOnly(expStart)}` : ''}${expEnd ? ` To: ${formatDateOnly(expEnd)}` : ''}`;
        doc.setFontSize(10);
        doc.text(rTxt, 105, 28, { align: 'center' });
      }

      const toExport = records.filter(r => {
        const mLoc = expLoc === 'All Locations' || r.location === expLoc;
        const d = new Date(r.recorded_at);
        const mStart = expStart ? d >= new Date(expStart) : true;
        const mEnd = expEnd ? d <= new Date(expEnd + 'T23:59:59') : true;
        return mLoc && mStart && mEnd;
      });

      const byDay = {};
      toExport.forEach(r => {
        const day = formatDateOnly(r.recorded_at);
        if (!byDay[day]) byDay[day] = {};
        if (!byDay[day][r.location]) byDay[day][r.location] = [];
        byDay[day][r.location].push(r);
      });

      let first = true;
      Object.entries(byDay).forEach(([day, locations]) => {
        if (!first) doc.addPage();
        first = false;

        header();

        let y = 40;
        doc.setFontSize(16);
        doc.text(formatDateOnlyWithDay(day), 105, y, { align: 'center' });
        y += 10;

        Object.entries(locations).forEach(([loc, recs]) => {
          doc.setFontSize(14);
          doc.text(loc, 14, y);
          y += 8;

          autoTable(doc, {
            startY: y,
            head: [['Recorded At', 'Name', 'Temperature']],
            body: recs.map(r => [
              formatToPST(r.recorded_at),
              r.name,
              `${r.temperature}°${r.unit}`
            ]),
            styles: { fontSize: 9 },
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185] },
            margin: { left: 14, right: 14 },
            didDrawCell: dCell => {
              const rec = recs[dCell.row.index];
              const l = rec.location.toLowerCase();
              const isFridge = l.includes('refrigerator') || l.includes('cooler');
              const isFreezer = l.includes('freezer');
              const temp = rec.temperature;

              if (
                (rec.unit === 'C' && ((isFridge && temp > 4) || (isFreezer && temp < -18))) ||
                (rec.unit === 'F' && ((isFridge && temp > 39.2) || (isFreezer && temp < -0.4)))
              ) {
                dCell.cell.styles.fillColor = [255, 204, 204]; // Light red
                dCell.cell.styles.textColor = [200, 0, 0]; // Dark red text
              }
            },
            didDrawPage: data => {
              y = data.cursor.y + 10;
              if (doc.internal.getNumberOfPages() > 1 && y < 50) {
                header();
                doc.setFontSize(16);
                doc.text(formatDateOnlyWithDay(day), 105, 40, { align: 'center' });
                y = 50;
              }
            }
          });

          y = doc.lastAutoTable.finalY + 10;
        });
      });

      const d = new Date();
      const fn = `Temp_Records_${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}.pdf`;
      doc.save(fn);
    };
  };

  return (
    <div className="max-w-5xl mx-auto p-4 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4 text-center">Temperature Records</h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <select value={locFilter} onChange={e => setLocFilter(e.target.value)} className="px-4 py-2 border rounded">
          {LOCATIONS.map(l => <option key={l}>{l}</option>)}
        </select>
        <input type="date" max={today} value={startDate} onChange={e => setStartDate(e.target.value)} className="px-4 py-2 border rounded"/>
        <input type="date" max={today} value={endDate} onChange={e => setEndDate(e.target.value)} className="px-4 py-2 border rounded"/>
        <button onClick={reset} className="bg-gray-300 px-4 py-2 rounded">Reset Filters</button>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => { setExpLoc(locFilter); setExpStart(startDate); setExpEnd(endDate); setShowExport(true); }}
          className="bg-red-600 text-white px-4 py-2 rounded mb-6"
        >
          Export to PDF
        </button>
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-600">No temperature records found for selected filters.</p>
      ) : (
        (() => {
          const byDay = {};
          filtered.forEach(r => {
            const day = formatDateOnly(r.recorded_at);
            if (!byDay[day]) byDay[day] = [];
            byDay[day].push(r);
          });

          return Object.entries(byDay).map(([day, recordsForDay]) => {
            const byLocation = {};
            recordsForDay.forEach(r => {
              if (!byLocation[r.location]) byLocation[r.location] = [];
              byLocation[r.location].push(r);
            });

            return (
              <div key={day} className="mb-10">
                <h3 className="text-xl font-bold text-blue-800 border-b pb-2 mb-3">{formatDateOnlyWithDay(day)}</h3>
                {Object.entries(byLocation).map(([loc, recs]) => {
                  const isOpen = openLocations[day]?.[loc];
                  return (
                    <div key={loc} className="mb-6 border rounded">
                      <div
                        onClick={() => toggleLocation(day, loc)}
                        className="p-3 bg-gray-100 cursor-pointer flex justify-between items-center"
                      >
                        <h4 className="text-lg font-semibold text-gray-700">{loc}</h4>
                        <span className="text-blue-500 text-sm">{isOpen ? '▲ Hide' : '▼ Show'}</span>
                      </div>
                      {isOpen && <RecordTable records={recs} />}
                    </div>
                  );
                })}
              </div>
            );
          });
        })()
      )}

      {showExport && (
        <ExportModal
          isOpen
          onClose={() => setShowExport(false)}
          onExport={() => { handleExportPDF(); setShowExport(false); }}
          location={expLoc}
          setLocation={setExpLoc}
          startDate={expStart}
          setStartDate={setExpStart}
          endDate={expEnd}
          setEndDate={setExpEnd}
          todayStr={today}
        />
      )}
    </div>
  );
}
