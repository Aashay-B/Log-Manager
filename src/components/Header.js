import React from 'react';

export default function Header() {
  return (
    <header className="bg-white shadow py-4">
      <div className="container mx-auto flex items-center justify-center space-x-4">
        <img src="/logo.png" alt="Logo" className="h-16 w-auto" />
        <h1 className="text-3xl font-bold text-gray-800">Cleaning Task Manager</h1>
      </div>
    </header>
  );
}
