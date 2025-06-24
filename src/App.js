// src/App.js

import React, { useState, useEffect } from 'react';
import TaskForm from './components/TaskForm';
import TaskList from './components/TaskList';
import TempRecorderForm from './components/TempRecorderForm';
import TempRecordsList from './components/TempRecordsList';
import Header from './components/Header';

const ACCESS_KEY = '1234';

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
      setShowGifError(true);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      {/* Header */}
        <div className="bg-white text-gray-900 flex items-center justify-center gap-4 py-6 text-3xl font-bold shadow">
          <img src="/Logo.jpg" alt="Cioffi's Logo" className="h-16 md:h-20 lg:h-24" />
          Cioffi's Log Manager
        </div>


      {/* Modals */}
      {showKeyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4 text-center">Enter Access Key</h3>
            <form onSubmit={(e) => { e.preventDefault(); validateAccessKey(); }}>
              <input
                type="password"
                value={enteredKey}
                onChange={(e) => setEnteredKey(e.target.value)}
                placeholder="Access key"
                className="w-full border rounded p-2 mb-4"
                autoFocus
              />
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setShowKeyModal(false)}
                  className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Submit
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {showGifError && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow max-w-sm w-full text-center">
            <h3 className="text-lg font-semibold mb-2 text-red-600">Access Denied</h3>
            <img
              src="/wait-a-minute-who-are-you.gif"
              alt="Access Denied"
              className="w-96 h-96 mx-auto"
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

      {/* Main Content */}
      {view === 'home' ? (
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)] pt-8">
          <div className="bg-white p-10 rounded-2xl shadow-xl text-center w-full max-w-md">
            <div className="flex flex-col space-y-10">
              <button
                onClick={() => setView('taskForm')}
                className="bg-blue-600 text-white py-4 text-lg rounded-full hover:bg-blue-700 transition"
              >
                Task Form
              </button>
              <button
                onClick={() => handleProtectedView('taskList')}
                className="bg-green-600 text-white py-4 text-lg rounded-full hover:bg-green-700 transition"
              >
                Task List
              </button>
              <button
                onClick={() => setView('tempRecorder')}
                className="bg-red-600 text-white py-4 text-lg rounded-full hover:bg-red-700 transition"
              >
                Temp Recorder
              </button>
              <button
                onClick={() => handleProtectedView('tempList')}
                className="bg-purple-600 text-white py-4 text-lg rounded-full hover:bg-yellow-700 transition"
              >
                Temp Records
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <button
              onClick={() => setView('home')}
              className="
                bg-blue-600 hover:bg-blue-700
                text-white
                font-semibold
                px-6 py-3
                rounded-md
                shadow-lg
                inline-flex items-center
                space-x-3
                transition
                focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2
              "
            >
              <span className="text-3xl leading-none">←</span>
              <span className="text-xl">Back to Home</span>
            </button>
          </div>

          <div className="mt-6 overflow-y-auto px-4">
            {view === 'taskForm' && <TaskForm />}
            {view === 'taskList' && <TaskList />}
            {view === 'tempRecorder' && <TempRecorderForm />}
            {view === 'tempList' && <TempRecordsList />}
          </div>
        </>
      )}
    </div>
  );
}
