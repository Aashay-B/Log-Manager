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
function formatDateOnly(dt) {
  return format(new Date(dt), 'yyyy-MM-dd');
}

function Disclosure({ record }) {
  const [open, setOpen] = useState(false);
  const loc = record.location.toLowerCase();
  const critical = (loc.includes('refrigerator') && record.temperature > 4) ||
                   (loc.includes('freezer') && record.temperature < -18);

  return (
    <div
      onClick={() => setOpen(!open)}
      className={`border rounded p-3 mb-2 cursor-pointer transition 
        ${critical ? 'bg-red-100 text-red-700 border-red-300' : 'bg-gray-50'}`}
    >
      <div className="flex justify-between items-center">
        <div>
          <span className="font-medium">{formatToPST(record.recorded_at)}</span>
          <span className="ml-2 text-gray-600">— {record.name}</span>
        </div>
        <span className="text-xs text-blue-600">{open ? 'Hide' : 'Details'}</span>
      </div>
      {open && (
        <div className="mt-3 space-y-1 text-sm">
          <div><strong>Location:</strong> {record.location}</div>
          <div><strong>Name:</strong> {record.name}</div>
          <div><strong>Temperature:</strong> {record.temperature}°{record.unit}</div>
          <div><strong>Recorded At:</strong> {formatToPST(record.recorded_at)}</div>
        </div>
      )}
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
  }

  const handleExportPDF = () => {
  const doc = new jsPDF();
  const logo = new Image();
  logo.src = `${window.location.origin}/logo.png`;

  logo.onload = () => {
    function header() {
      doc.addImage(logo, 'PNG', 7, 4, 50, 20);
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

    const grouped = {};
    toExport.forEach(r => {
      const loc = r.location;
      const day = formatDateOnly(r.recorded_at);
      if (!grouped[loc]) grouped[loc] = {};
      if (!grouped[loc][day]) grouped[loc][day] = [];
      grouped[loc][day].push(r);
    });

    let first = true;
    Object.entries(grouped).forEach(([loc, days]) => {
      if (!first) doc.addPage();
      first = false;
      header();

      let y = 40;
      doc.setFontSize(16);
      doc.text(loc, 14, y);
      y += 8;

      Object.entries(days).forEach(([day, arr]) => {
        const dayName = new Date(day).toLocaleDateString('en-US', { weekday: 'long' });
        doc.setFontSize(12);
        doc.text(`${dayName}, ${day}`, 16, y);
        y += 6;

        autoTable(doc, {
          startY: y,
          head: [['Recorded At', 'Name', 'Temperature']],
          body: arr.map(r => [
            formatToPST(r.recorded_at),
            r.name,
            `${r.temperature}°${r.unit}`
          ]),
          styles: { fontSize: 9 },
          theme: 'grid',
          headStyles: { fillColor: [41, 128, 185] },
          margin: { left: 14, right: 14 },
          didDrawCell: dCell => {
            const rec = arr[dCell.row.index];
            const l = rec.location.toLowerCase();
            const isFridge = l.includes('refrigerator') || l.includes('cooler');
            const isFreezer = l.includes('freezer');
            const temp = rec.temperature;

            if ((isFridge && temp > 4) || (isFreezer && temp < -18)) {
              dCell.cell.styles.fillColor = [255, 204, 204]; // Light red
              dCell.cell.styles.textColor = [200, 0, 0]; // Dark red text
            }
          },
          didDrawPage: data => {
            y = data.cursor.y + 10;
            if (doc.internal.getNumberOfPages() > 1 && y < 50) {
              header();
              doc.setFontSize(16);
              doc.text(loc, 14, 40);
              y = 50;
            }
          }
        });

        y += 10;
      });
    });

    const d = new Date();
    const fn = `Temp_Records_${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}.pdf`;
    doc.save(fn);
  };
};

  return (
    <div className="max-w-3xl mx-auto p-4 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4 text-center">Temperature Records</h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <select value={locFilter} onChange={e=>setLocFilter(e.target.value)} className="px-4 py-2 border rounded">
          {LOCATIONS.map(l=> <option key={l}>{l}</option>)}
        </select>
        <input type="date" max={today} value={startDate} onChange={e=>setStartDate(e.target.value)} className="px-4 py-2 border rounded"/>
        <input type="date" max={today} value={endDate} onChange={e=>setEndDate(e.target.value)} className="px-4 py-2 border rounded"/>
        <button onClick={reset} className="bg-gray-300 px-4 py-2 rounded">Reset Filters</button>
      </div>
      <div className="flex justify-end">
        <button
          onClick={()=>{setExpLoc(locFilter); setExpStart(startDate); setExpEnd(endDate); setShowExport(true);}}
          className="bg-red-600 text-white px-4 py-2 rounded mb-6"
          align="right"
        >
          Export to PDF
        </button>
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-600">No temperature records found for selected filters.</p>
      ) : (
        LOCATIONS.filter(l=>l!=='All Locations').map(loc=> {
          const recs = filtered.filter(r=>r.location===loc);
          if (!recs.length) return null;

          const byDay = {};
          recs.forEach(r=> {
            const day = formatDateOnly(r.recorded_at);
            byDay[day] = byDay[day]||[];
            byDay[day].push(r);
          });

          return (
            <div key={loc} className="mb-8">
              <h3 className="text-xl font-semibold border-b pb-1 mb-2">{loc}</h3>
              {Object.entries(byDay).map(([day, arr])=>(
                <div key={day}>
                  <h4 className="font-medium text-blue-700">{formatDateOnlyWithDay(day)}</h4>
                  {arr.map(r=> <Disclosure key={r.id} record={r} />)}
                </div>
              ))}
            </div>
          );
        })
      )}

      {showExport && (
        <ExportModal
          isOpen
          onClose={()=>setShowExport(false)}
          onExport={()=>{handleExportPDF(); setShowExport(false);}}
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
