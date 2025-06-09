import React from 'react';

const SimpleTest: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          🎯 Test Simple
        </h1>
        <p className="text-gray-600 mb-4">
          Si vous voyez ce message, React fonctionne correctement !
        </p>
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          ✅ Application chargée avec succès
        </div>
        <div className="mt-4">
          <button 
            onClick={() => alert('Bouton cliqué !')}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Tester JavaScript
          </button>
        </div>
        <div className="mt-4 text-sm text-gray-500">
          <p>URL actuelle : {window.location.href}</p>
          <p>Port : {window.location.port}</p>
        </div>
      </div>
    </div>
  );
};

export default SimpleTest; 