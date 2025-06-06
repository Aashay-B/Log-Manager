// src/App.js

import React, { useState } from 'react';
import TaskForm from './components/TaskForm';
import TaskList from './components/TaskList';
import TempRecorderForm from './components/TempRecorderForm';
import TempRecordsList from './components/TempRecordsList';
import Header from './components/Header';

export default function App() {
  const [view, setView] = useState('home');

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />

      <div className="max-w-xl mx-auto bg-white p-6 rounded shadow text-center">
        {view === 'home' && (
          <div className="flex flex-col space-y-4">
            <button
              onClick={() => setView('taskForm')}
              className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            >
              Task Form
            </button>
            <button
              onClick={() => setView('taskList')}
              className="bg-green-600 text-white py-2 rounded hover:bg-green-700"
            >
              Task List
            </button>
            <button
              onClick={() => setView('tempRecorder')}
              className="bg-red-600 text-white py-2 rounded hover:bg-red-700"
            >
              Temp Recorder
            </button>
            <button
              onClick={() => setView('tempList')}
              className="bg-purple-600 text-white py-2 rounded hover:bg-purple-700"
            >
              View Temperature Records
            </button>
          </div>
        )}

        {view !== 'home' && (
          <button
            onClick={() => setView('home')}
            className="mt-6 text-blue-500 underline"
          >
            ← Back to Home
          </button>
        )}
      </div>

      {/* Render appropriate view */}
      <div className="mt-6">
        {view === 'taskForm' && <TaskForm />}
        {view === 'taskList' && <TaskList />}
        {view === 'tempRecorder' && <TempRecorderForm />}
        {view === 'tempList' && <TempRecordsList />}
      </div>
    </div>
  );
}
