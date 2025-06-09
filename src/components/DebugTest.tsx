// Composant de debug ultra-simple
function DebugTest() {
  console.log('DebugTest: Composant chargé');
  
  try {
    return (
      <div>
        <h1>Debug Test</h1>
        <p>Si vous voyez ceci, React fonctionne !</p>
        <p>Timestamp: {Date.now()}</p>
      </div>
    );
  } catch (error) {
    console.error('Erreur dans DebugTest:', error);
    return <div>Erreur dans le composant</div>;
  }
}

export default DebugTest; 