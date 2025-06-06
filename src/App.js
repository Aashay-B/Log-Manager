import React, { useState } from 'react';
import TaskForm from './components/TaskForm';
import TaskList from './components/TaskList';
import Header from './components/Header';

function App() {
  const [view, setView] = useState('');

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />

      <div className="p-4">
        {view && (
          <button
            onClick={() => setView('')}
            className="mb-4 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
          >
            ← Back to Menu
          </button>
        )}

        {!view && (
          <div className="flex flex-col space-y-4 items-center justify-center">
            <button
              onClick={() => setView('form')}
              className="bg-green-600 text-white px-6 py-3 rounded text-lg shadow hover:bg-green-700"
            >
              Add Task
            </button>
            <button
              onClick={() => setView('list')}
              className="bg-blue-600 text-white px-6 py-3 rounded text-lg shadow hover:bg-blue-700"
            >
              View Tasks
            </button>
          </div>
        )}

        {view === 'form' && <TaskForm />}
        {view === 'list' && <TaskList />}
      </div>
    </div>
  );
}

export default App;
