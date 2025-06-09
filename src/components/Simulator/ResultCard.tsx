import { CheckCircle2, XCircle, AlertCircle, ExternalLink, AlertTriangle } from 'lucide-react';

interface Result {
  aidLinked?: string;
  userMessage?: string;
  score?: number;
}

interface ResultCardProps {
  results: Result[];
  onReset: () => void;
}

const ResultCard: React.FC<ResultCardProps> = ({ results, onReset }) => {
  if (results.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6">
          <p className="text-xl text-gray-900">
            D'après vos réponses, nous ne pouvons pas déterminer votre éligibilité. Veuillez contacter un assistant social pour plus d'informations.
          </p>
        </div>
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105"
        >
          Recommencer
        </button>
      </div>
    );
  }

  const getStatusIcon = (score?: number) => {
    if (typeof score !== 'number') return null;
    if (score >= 0.8) return <CheckCircle2 className="w-6 h-6 text-green-500" />;
    if (score >= 0.5) return <AlertTriangle className="w-6 h-6 text-yellow-500" />;
    return <XCircle className="w-6 h-6 text-red-500" />;
  };

  return (
    <div className="space-y-6">
      {results.map((result, index) => (
        <div
          key={index}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-start gap-4">
            {getStatusIcon(result.score)}
            <div>
              {result.aidLinked && (
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {result.aidLinked}
                </h3>
              )}
              {result.userMessage && (
                <p className="text-gray-600">
                  {result.userMessage}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
      
      <button
        onClick={onReset}
        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105"
      >
        Recommencer
      </button>
    </div>
  );
};

export default ResultCard;