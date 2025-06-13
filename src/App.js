// src/App.js

import React, { useState, useEffect } from 'react';
import TaskForm from './components/TaskForm';
import TaskList from './components/TaskList';
import TempRecorderForm from './components/TempRecorderForm';
import TempRecordsList from './components/TempRecordsList';
import Header from './components/Header';

const ACCESS_KEY = '1234'; // Change this to your desired key

export default function App() {
  const [view, setView] = useState('home');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [pendingView, setPendingView] = useState('');
  const [enteredKey, setEnteredKey] = useState('');
  const [showGifError, setShowGifError] = useState(false);

  useEffect(() => {
    document.title = "Cioffi's Log Manager";
  }, []);

  const handleProtectedView = (viewName) => {
    setPendingView(viewName);
    setEnteredKey('');
    setShowKeyModal(true);
  };

  const validateAccessKey = () => {
    if (enteredKey === ACCESS_KEY) {
      setView(pendingView);
      setShowKeyModal(false);
    } else {
      setShowKeyModal(false);
      setShowGifError(true); // Show GIF error modal
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />

      {/* Access Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4 text-center">Enter Access Key</h3>
            <input
              type="password"
              value={enteredKey}
              onChange={(e) => setEnteredKey(e.target.value)}
              placeholder="Access key"
              className="w-full border rounded p-2 mb-4"
            />
            <div className="flex justify-between">
              <button
                onClick={() => setShowKeyModal(false)}
                className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={validateAccessKey}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GIF Error Modal */}
      {showGifError && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow max-w-sm w-full text-center">
            <h3 className="text-lg font-semibold mb-2 text-red-600">Access Denied</h3>
            <img
              src="/denied-barney.gif" // 🔁 Replace this with your own GIF URL
              alt="Access Denied"
              className="w-48 h-48 mx-auto"
            />
            <p className="mt-4 text-gray-700">Incorrect key. Try again!</p>
            <button
              onClick={() => setShowGifError(false)}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Home Buttons */}
      {view === 'home' && (
        <div className="max-w-xl mx-auto bg-white p-6 rounded shadow text-center mt-6">
          <div className="flex flex-col space-y-4">
            <button
              onClick={() => setView('taskForm')}
              className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            >
              Task Form
            </button>
            <button
              onClick={() => handleProtectedView('taskList')}
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
              onClick={() => handleProtectedView('tempList')}
              className="bg-purple-600 text-white py-2 rounded hover:bg-yellow-700"
            >
              Temp Records
            </button>
          </div>
        </div>
      )}

      {/* Back Button */}
      {view !== 'home' && (
        <div className="text-center mt-4">
          <button
            onClick={() => setView('home')}
            className="text-blue-500 underline"
          >
            ← Back to Home
          </button>
        </div>
      )}

      {/* Render Views */}
      <div className="mt-6">
        {view === 'taskForm' && <TaskForm />}
        {view === 'taskList' && <TaskList />}
        {view === 'tempRecorder' && <TempRecorderForm />}
        {view === 'tempList' && <TempRecordsList />}
      </div>
    </div>
  );
}
