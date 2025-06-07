import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { format } from 'date-fns-tz';
import { jsPDF } from 'jspdf'
import { autoTable } from 'jspdf-autotable'


// Register the plugin
// const doc = new jsPDF()

const PST_TIMEZONE = 'America/Los_Angeles';

function formatToPST(dateString) {
  const date = new Date(dateString);
  return format(date, 'yyyy-MM-dd hh:mm aaaa zzz', { timeZone: PST_TIMEZONE });
}

const departments = ['All Departments', 'Meat', 'Deli', 'General Warehouse'];

export default function TaskList() {
  const [tasks, setTasks] = useState([]);
  const [selectedDept, setSelectedDept] = useState('All Departments');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [showExport, setShowExport] = useState(false);
  const [exportDept, setExportDept] = useState('All Departments');
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');

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

  const filteredTasks = tasks.filter(task => {
    const matchesDept =
      selectedDept === 'All Departments' || task.department === selectedDept;

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

  
  const handleExportPDF = () => {
    const doc = new jsPDF();

    // Apply export filters here
    const exportFilteredTasks = tasks.filter(task => {
        const matchesDept =
        exportDept === 'All Departments' || task.department === exportDept;

        const taskTime = new Date(task.cleaning_time);
        const matchesStart = exportStartDate
        ? taskTime >= new Date(exportStartDate)
        : true;
        const matchesEnd = exportEndDate
        ? taskTime <= new Date(exportEndDate + 'T23:59:59')
        : true;

        return matchesDept && matchesStart && matchesEnd;
    });

    const tableHead = [['Name', 'Department', 'Cleaning Time', 'Things Cleaned']];
    const tableBody = exportFilteredTasks.map(task => [
        task.name,
        task.department,
        new Date(task.cleaning_time).toLocaleString('en-US', {
        timeZone: 'America/Los_Angeles',
        dateStyle: 'short',
        timeStyle: 'short',
        }),
        task.things_cleaned,
    ]);

    autoTable(doc, {
        head: tableHead,
        body: tableBody,
        styles: { fontSize: 10 },
        margin: { top: 20 },
        headStyles: { fillColor: [22, 160, 133] },
    });

    doc.save('tasks.pdf');
    };


  return (
    <div className="max-w-3xl mx-auto p-4 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4 text-center">Task Logs</h2>
      {/* Filter Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Filter by Department
          </label>
          <select
            value={selectedDept}
            onChange={e => setSelectedDept(e.target.value)}
            className="px-4 py-2 border rounded w-full"
          >
            {departments.map(dept => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="px-4 py-2 border rounded w-full"
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
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
      <div className="mb-4 text-right">  
      {/* Export Button */}
      <button
        onClick={() => setShowExport(!showExport)}
        className="bg-red-600 text-white px-4 py-2 rounded shadow hover:bg-red-700 mb-6"
      >
        {showExport ? 'Cancel Export' : 'Export to PDF'}
      </button>
      </div>
      {/* Export Filter Section */}
      {showExport && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 bg-white p-4 rounded shadow">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Department</label>
            <select
              value={exportDept}
              onChange={e => setExportDept(e.target.value)}
              className="px-4 py-2 border rounded w-full"
            >
              {departments.map(dept => (
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
              value={exportStartDate}
              onChange={e => setExportStartDate(e.target.value)}
              className="px-4 py-2 border rounded w-full"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">End Date</label>
            <input
              type="date"
              value={exportEndDate}
              onChange={e => setExportEndDate(e.target.value)}
              className="px-4 py-2 border rounded w-full"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleExportPDF}
              className="bg-red-600 text-white px-4 py-2 rounded w-full hover:bg-red-700"
            >
              Export PDF
            </button>
          </div>
        </div>
      )}

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <p className="text-gray-600">No tasks found for selected filters.</p>
      ) : (
        <div className="space-y-4">
          {filteredTasks.map(task => (
            <div key={task.id} className="bg-white shadow rounded p-2">
              <div className="text-lg font-semibold text-gray-800">{task.name}</div>
              <div className="text-sm text-gray-500 mb-1">{task.department}</div>
              <div className="text-sm text-gray-600">{formatToPST(task.cleaning_time)}</div>
              <div className="mt-2 text-gray-700">{task.things_cleaned}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
