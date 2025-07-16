// src/components/TaskList.js

import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { format } from 'date-fns-tz';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const PST_TIMEZONE = 'America/Los_Angeles';

function formatDateOnlyWithDaytime(dt) {
  return format(new Date(dt), 'EEEE, yyyy-MM-dd hh:mm aaaa');
}

function formatToPST(dateString) {
  const date = new Date(dateString);
  return format(date, 'yyyy-MM-dd hh:mm aaaa zzz', { timeZone: PST_TIMEZONE });
}
function formatDateOnly(dateString) {
  const date = new Date(dateString);
  return format(date, 'yyyy-MM-dd', { timeZone: PST_TIMEZONE });
}

const departments = ['All Departments', 'Deli', 'Warehouse'];

function ExportModal({
  isOpen,
  onClose,
  onExport,
  exportFormat,
  setExportFormat,
  dept,
  setDept,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  todayStr,
  area,
  setArea,
  areaOptions,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
        <h2 className="text-xl font-semibold mb-4 text-center">Export Data</h2>

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
            <label className="block text-sm font-medium text-gray-700 mb-1">Area/Equipment</label>
            <select
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="border px-3 py-2 rounded w-full"
            >
              <option value="All Areas">All Areas</option>
              {areaOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Export Format</label>
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              className="border px-3 py-2 rounded w-full"
            >
              <option value="pdf">PDF</option>
              <option value="excel">Excel (.xlsx)</option>
            </select>
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
  const todayStr = new Date().toISOString().slice(0, 10);
  const firstOfMonthStr = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .slice(0, 10);

  const [tasks, setTasks] = useState([]);
  const [selectedDept, setSelectedDept] = useState('All Departments');
  const [startDate, setStartDate] = useState(firstOfMonthStr);
  const [endDate, setEndDate] = useState(todayStr);

  const [showExportModal, setShowExportModal] = useState(false);
  const [exportDept, setExportDept] = useState('All Departments');
  const [exportStartDate, setExportStartDate] = useState(firstOfMonthStr);
  const [exportEndDate, setExportEndDate] = useState(todayStr);
  const [exportFormat, setExportFormat] = useState('pdf'); // pdf or excel
  const [exportArea, setExportArea] = useState('All Areas');

  // Unique area/equipment options from tasks for dropdown
  const areaOptions = [...new Set(tasks.map(t => t.area_equipment || 'Unknown Area'))];

  // Track expanded/collapsed state per area/equipment group
  const [expandedGroups, setExpandedGroups] = useState({});

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

  // Filter tasks by department and date range
  const filteredTasks = tasks.filter((task) => {
    const matchesDept = selectedDept === 'All Departments' || task.department === selectedDept;
    const taskTime = new Date(task.cleaning_time);
    const matchesStart = startDate ? taskTime >= new Date(startDate) : true;
    const matchesEnd = endDate ? taskTime <= new Date(endDate + 'T23:59:59') : true;
    return matchesDept && matchesStart && matchesEnd;
  });

  // Group filtered tasks by area_equipment
  const groupedByArea = filteredTasks.reduce((groups, task) => {
    const area = task.area_equipment || 'Unknown Area';
    if (!groups[area]) groups[area] = [];
    groups[area].push(task);
    return groups;
  }, {});

  // Reset filters
  const resetFilters = () => {
    setSelectedDept('All Departments');
    setStartDate(firstOfMonthStr);
    setEndDate(todayStr);
  };

  // Export to Excel
  const exportToExcel = () => {
    const tasksToExport = tasks.filter((task) => {
      const matchesDept = exportDept === 'All Departments' || task.department === exportDept;
      const matchesArea = exportArea === 'All Areas' || (task.area_equipment || 'Unknown Area') === exportArea;
      const taskTime = new Date(task.cleaning_time);
      const matchesStart = exportStartDate ? taskTime >= new Date(exportStartDate) : true;
      const matchesEnd = exportEndDate ? taskTime <= new Date(exportEndDate + 'T23:59:59') : true;
      return matchesDept && matchesStart && matchesEnd && matchesArea;
    });

    if (tasksToExport.length === 0) {
      alert("No tasks found for the selected filters.");
      return;
    }

    // Prepare and sort data rows
    const data = tasksToExport
      .sort((a, b) => new Date(a.cleaning_time) - new Date(b.cleaning_time))
      .map((task) => {
        const dt = new Date(task.cleaning_time);
        const dayStr = dt.toLocaleDateString('en-US', { weekday: 'long' });
        const dateStr = formatToPST(task.cleaning_time);
        return {
          'Department': task.department,
          'Area/Equipment': task.area_equipment || 'Unknown Area',
          'Cleaned By': task.cleaned_by,
          'Date & Time (PST)': dateStr,
          'Day': dayStr,
          'Comments': task.comments || '',
        };
      });

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(data, {
      origin: 'A3', // leave space for title
    });

    // Add title row
    const title = `Task Export - ${exportDept} - ${formatDateOnly(exportStartDate)} to ${formatDateOnly(exportEndDate)}`;
    XLSX.utils.sheet_add_aoa(worksheet, [[title]], { origin: 'A1' });

    // Style column widths automatically
    const colWidths = Object.keys(data[0]).map((key) => {
      const maxLen = Math.max(
        key.length,
        ...data.map((row) => (row[key] ? row[key].toString().length : 0))
      );
      return { wch: maxLen + 2 }; // add padding
    });
    worksheet['!cols'] = colWidths;

    // Create workbook and export
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Task Logs');

    const fileName = `task_export_${formatDateOnly(new Date())}.xlsx`;
    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    saveAs(blob, fileName);
  };


  // Export to PDF (grouped by department and date)
  const handleExportPDF = async () => {
  const doc = new jsPDF();
  const logo = new Image();
  logo.src = `${window.location.origin}/Logo.jpg`;

  await new Promise((resolve) => (logo.onload = resolve));

  function addPageHeader(dept) {
    doc.addImage(logo, 'PNG', 10, 6, 40, 20);
    doc.setFontSize(14);
    doc.text('Task Logs Export', 105, 15, { align: 'center' });

    const rangeText =
      (exportStartDate ? `From: ${formatDateOnly(exportStartDate)}` : '') +
      (exportEndDate ? ` To: ${formatDateOnly(exportEndDate)}` : '');

    doc.setFontSize(10);
    doc.text(rangeText, 105, 23, { align: 'center' });

    doc.setFontSize(12);
    doc.text(`${dept} Department`, 14, 35);
  }

  const groupedTasks = {};
  tasks.forEach((task) => {
    const matchesDept = exportDept === 'All Departments' || task.department === exportDept;
    const matchesArea = exportArea === 'All Areas' || (task.area_equipment || 'Unknown Area') === exportArea;
    const taskTime = new Date(task.cleaning_time);
    const matchesStart = exportStartDate ? taskTime >= new Date(exportStartDate) : true;
    const matchesEnd = exportEndDate ? taskTime <= new Date(exportEndDate + 'T23:59:59') : true;

    if (matchesDept && matchesStart && matchesEnd && matchesArea) {
      const dept = task.department;
      if (!groupedTasks[dept]) groupedTasks[dept] = [];
      groupedTasks[dept].push(task);
    }
  });

  let firstPage = true;
  for (const dept of Object.keys(groupedTasks)) {
    if (!firstPage) doc.addPage();
    firstPage = false;

    addPageHeader(dept);

    const tasksForDept = groupedTasks[dept];

    autoTable(doc, {
      startY: 45,
      head: [['Cleaning Time', 'Cleaned By', 'Area/Equipment', 'Comments']],
      body: tasksForDept.map((task) => [
        formatDateOnlyWithDaytime(task.cleaning_time),
        task.cleaned_by,
        task.area_equipment || 'Unknown Area',
        task.comments || '',
      ]),
      styles: { fontSize: 9 },
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
      margin: { left: 14, right: 14 },
    });
  }

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const filename = `tasks_by_department_${yyyy}${mm}${dd}.pdf`;

  doc.save(filename);
};


  // Main export handler triggered by export modal's Export button
  const handleExport = () => {
    if (exportFormat === 'pdf') {
      handleExportPDF();
    } else if (exportFormat === 'excel') {
      exportToExcel();
    }
    setShowExportModal(false);
  };

  // Toggle all expand/collapse
const toggleAll = () => {
  const allGroupKeys = [];

  Object.entries(groupedByArea).forEach(([area, areaTasks]) => {
    // Find the department name for this area
    areaTasks.forEach((task) => {
      const dept = task.department || 'Unknown Department';
      const groupKey = `${dept}-${area}`;
      allGroupKeys.push(groupKey);
    });
  });

  const allCurrentlyExpanded = allGroupKeys.every((key) => expandedGroups[key]);

  const newExpandedState = {};
  allGroupKeys.forEach((key) => {
    newExpandedState[key] = !allCurrentlyExpanded;
  });

  setExpandedGroups(newExpandedState);
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
              <option key={dept} value={dept}>{dept}</option>
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

      {/* Export & Expand/Collapse Buttons */}
      <div className="mb-4 flex justify-between items-center">
        <button
          onClick={toggleAll}
          className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
        >
          {
            filteredTasks
              .map(task => `${task.department || 'Unknown Department'}-${task.area_equipment || 'Unknown Area'}`)
              .every(key => expandedGroups[key])
              ? 'Collapse All'
              : 'Expand All'
          }
        </button>

        <button
          onClick={() => {
            setExportDept(selectedDept);
            setExportStartDate(startDate);
            setExportEndDate(endDate);
            setExportFormat('pdf');
            setShowExportModal(true);
          }}
          className="bg-red-600 text-white px-4 py-2 rounded shadow hover:bg-red-700"
        >
          Export
        </button>
      </div>

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        exportFormat={exportFormat}
        setExportFormat={setExportFormat}
        dept={exportDept}
        setDept={setExportDept}
        startDate={exportStartDate}
        setStartDate={setExportStartDate}
        endDate={exportEndDate}
        setEndDate={setExportEndDate}
        todayStr={todayStr}
        area={exportArea}
        setArea={setExportArea}
        areaOptions={areaOptions}
      />

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <p className="text-gray-600 text-center mt-4">No tasks found for selected filters.</p>
      ) : (
        Object.entries(
          filteredTasks.reduce((acc, task) => {
            const dept = task.department || 'Unknown Department';
            if (!acc[dept]) acc[dept] = [];
            acc[dept].push(task);
            return acc;
          }, {})
        ).map(([deptName, deptTasks]) => {
          const groupedAreas = deptTasks.reduce((acc, task) => {
            const area = task.area_equipment || 'Unknown Area';
            if (!acc[area]) acc[area] = [];
            acc[area].push(task);
            return acc;
          }, {});

          return (
            <div key={deptName} className="mb-8">
              <h3 className="text-xl font-bold text-black-600 mb-4 border-b pb-2">{deptName}</h3>

              {Object.entries(groupedAreas).map(([area, entries]) => {
                const key = `${deptName}-${area}`;
                const isOpen = expandedGroups[key] ?? false;
                const showCleaningType = ['Meat Slicer 1', 'Meat Slicer 2', 'Cheese Slicer'].includes(area);

                return (
                  <div key={key} className="mb-4 border rounded shadow">
                    <div
                      onClick={() =>
                        setExpandedGroups((prev) => ({
                          ...prev,
                          [key]: !isOpen,
                        }))
                      }
                      className="bg-gray-100 px-4 py-3 font-semibold text-gray-800 cursor-pointer flex justify-between"
                    >
                      <span className="text-lg font-semibold text-gray-700">
                        {area}{' '}
                        <span className="text-sm text-gray-500">
                          ({entries.length} record{entries.length !== 1 ? 's' : ''})
                        </span>
                      </span>
                      <span className="text-sm text-blue-600">{isOpen ? '▲ Hide' : '▼ Show'}</span>
                    </div>

                    {isOpen && (
                      <table className="w-full text-sm table-auto border-t">
                        <thead>
                          <tr className="bg-gray-50 text-left">
                            <th className="px-4 py-2 border">Cleaned By</th>
                            <th className="px-4 py-2 border">Date</th>
                            <th className="px-4 py-2 border">Day</th>
                            {showCleaningType && (
                              <th className="px-4 py-2 border">Cleaning Type</th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {entries.map((entry) => {
                            const dt = new Date(entry.cleaning_time);
                            const dateStr = formatToPST(dt);
                            const dayStr = dt.toLocaleDateString('en-US', { weekday: 'long' });

                            return (
                              <tr key={entry.id} className="border-t">
                                <td className="px-4 py-2 border">{entry.cleaned_by}</td>
                                <td className="px-4 py-2 border">{dateStr}</td>
                                <td className="px-4 py-2 border">{dayStr}</td>
                                {showCleaningType && (
                                  <td className="px-4 py-2 border">{entry.cleaning_type || '—'}</td>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })
      )}
    </div>
  );
}

