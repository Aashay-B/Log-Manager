// src/components/TaskList.js

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
function formatDateOnly(dateString) {
  const date = new Date(dateString);
  return format(date, 'yyyy-MM-dd', { timeZone: PST_TIMEZONE });
}


const departments = ['All Departments', 'Deli', 'Warehouse'];

function Disclosure({ task }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className="bg-gray-50 border rounded p-3 shadow-sm cursor-pointer hover:bg-gray-100 transition"
      onClick={() => setIsOpen(!isOpen)}
    >
      <div className="flex justify-between items-center">
        <div>
          <span className="text-sm font-medium text-gray-700">{formatToPST(task.cleaning_time)}</span>
          <span className="ml-2 text-gray-600">— {task.cleaned_by}</span>
        </div>
        <span className="text-xs text-blue-600">{isOpen ? 'Hide' : 'Details'}</span>
      </div>

      {isOpen && (
        <div className="mt-3 text-sm text-gray-700 space-y-1">
          <div><strong>Department:</strong> {task.department}</div>
          <div><strong>Cleaned By:</strong> {task.cleaned_by}</div>
          <div><strong>Area/Equipment:</strong> {task.area_equipment}</div>
          <div><strong>Cleaning Time:</strong> {formatToPST(task.cleaning_time)}</div>
          {task.comments && <div><strong>Comments:</strong> {task.comments}</div>}
        </div>
      )}
    </div>
  );
}

function ExportModal({
  isOpen,
  onClose,
  onExport,
  dept,
  setDept,
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <select
              value={dept}
              onChange={(e) => setDept(e.target.value)}
              className="border px-3 py-2 rounded w-full"
            >
              {departments.map((deptOption) => (
                <option key={deptOption} value={deptOption}>{deptOption}</option>
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


export default function TaskList() {
  const [tasks, setTasks] = useState([]);
  const [selectedDept, setSelectedDept] = useState('All Departments');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [showExportModal, setShowExportModal] = useState(false);
  const [exportDept, setExportDept] = useState('All Departments');
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');

  // Calculate today's date and first of month date in YYYY-MM-DD format
  const todayStr = new Date().toISOString().slice(0, 10);
  const firstOfMonthStr = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .slice(0, 10);

  useEffect(() => {
    fetchTasks();
  }, []);

  async function fetchTasks() {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('cleaning_time', { ascending: false });

    if (error) console.error('Error fetching tasks:', error.message);
    else setTasks(data);
  }

  const filteredTasks = tasks.filter((task) => {
    const matchesDept = selectedDept === 'All Departments' || task.department === selectedDept;

    const taskTime = new Date(task.cleaning_time);
    const matchesStart = startDate ? taskTime >= new Date(startDate) : true;
    const matchesEnd = endDate ? taskTime <= new Date(endDate + 'T23:59:59') : true;

    return matchesDept && matchesStart && matchesEnd;
  });

  const resetFilters = () => {
    setSelectedDept('All Departments');
    setStartDate('');
    setEndDate('');
  };

  const handleExportPDF = async () => {
    const doc = new jsPDF();
    const logo = new Image();
    logo.src = `${window.location.origin}/logo.png`;

    await new Promise((resolve) => (logo.onload = resolve));
    doc.addImage(logo, 'PNG', 7, 0, 50, 40);
    

    doc.setFontSize(14);
    doc.text('Task Logs Export', 105, 20, { align: 'center' });

    const rangeText =
  (exportStartDate ? `From: ${formatDateOnly(exportStartDate)}` : '') +
  (exportEndDate ? ` To: ${formatDateOnly(exportEndDate)}` : '');


    doc.setFontSize(10);
    doc.text(rangeText, 105, 28, { align: 'center' });

    let yOffset = 40;

    const exportFilteredTasks = tasks.filter((task) => {
      const matchesDept = exportDept === 'All Departments' || task.department === exportDept;

      const taskTime = new Date(task.cleaning_time);
      const matchesStart = exportStartDate ? taskTime >= new Date(exportStartDate) : true;
      const matchesEnd = exportEndDate ? taskTime <= new Date(exportEndDate + 'T23:59:59') : true;

      return matchesDept && matchesStart && matchesEnd;
    });

    const groupedTasks = {};
    exportFilteredTasks.forEach((task) => {
      if (!groupedTasks[task.department]) {
        groupedTasks[task.department] = [];
      }
      groupedTasks[task.department].push(task);
    });

    for (const dept of Object.keys(groupedTasks)) {
      const deptTasks = groupedTasks[dept];

      if (yOffset > 250) {
        doc.addPage();
        yOffset = 20;
      }

      doc.setFontSize(12);
      doc.text(dept + ' Department', 14, yOffset);
      yOffset += 6;

      autoTable(doc, {
        startY: yOffset,
        head: [['Cleaning Time', 'Cleaned By', 'Area/Equipment', 'Comments']],
        body: deptTasks.map((task) => [
          formatToPST(task.cleaning_time),
          task.cleaned_by,
          task.area_equipment,
          task.comments || '',
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

    doc.save('tasks_by_department.pdf');
  };

  return (
    <div className="max-w-3xl mx-auto p-4 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4 text-center">Task Logs</h2>

      {/* Filter Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">Filter by Department</label>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-4 py-2 border rounded w-full"
          >
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
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
            setExportDept('All Departments');
            setExportStartDate(firstOfMonthStr);
            setExportEndDate(todayStr);
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
        dept={exportDept}
        setDept={setExportDept}
        startDate={exportStartDate}
        setStartDate={setExportStartDate}
        endDate={exportEndDate}
        setEndDate={setExportEndDate}
        todayStr={todayStr}
      />

      {/* Task List Section */}
      {filteredTasks.length === 0 ? (
        <p className="text-gray-600">No tasks found for selected filters.</p>
      ) : (
        ['Deli', 'Warehouse'].map((department) => {
          const deptTasks = filteredTasks.filter((task) => task.department === department);
          if (deptTasks.length === 0) return null;

          return (
            <div key={department} className="mb-6">
              <h3 className="text-lg font-semibold mb-2 border-b pb-1">{department} Tasks</h3>
              {deptTasks.map((task) => (
                <Disclosure key={task.id} task={task} />
              ))}
            </div>
          );
        })
      )}
    </div>
  );
}
