import React from 'react';

const MinimalTest: React.FC = () => {
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f0f0f0', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        maxWidth: '500px',
        width: '100%'
      }}>
        <h1 style={{ color: '#333', marginBottom: '1rem' }}>
          🔧 Test Minimal
        </h1>
        <p style={{ color: '#666', marginBottom: '1rem' }}>
          Ce composant utilise uniquement du CSS inline et aucune dépendance externe.
        </p>
        <div style={{
          backgroundColor: '#d4edda',
          border: '1px solid #c3e6cb',
          color: '#155724',
          padding: '0.75rem',
          borderRadius: '4px',
          marginBottom: '1rem'
        }}>
          ✅ React fonctionne !
        </div>
        <button 
          onClick={() => {
            console.log('Bouton cliqué !');
            alert('JavaScript fonctionne !');
          }}
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Tester JavaScript
        </button>
        <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#6c757d' }}>
          <p>Timestamp: {new Date().toLocaleString()}</p>
          <p>User Agent: {navigator.userAgent.substring(0, 50)}...</p>
        </div>
      </div>
    </div>
  );
};

export default MinimalTest; 