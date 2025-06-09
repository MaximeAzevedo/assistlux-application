import { CheckCircle2, Circle } from 'lucide-react';

interface QuestionCardProps {
  question: {
    id: string;
    question?: string;
    type: string;
    options?: string[];
    nextIfYes?: string;
    nextIfNo?: string;
  };
  onAnswer: (optionId: string) => void;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question, onAnswer }) => {
  if (!question.question) return null;

  const renderOptions = () => {
    if (question.type === 'yesno') {
      return (
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => onAnswer(question.nextIfYes || '')}
            className="px-6 py-4 text-center bg-white rounded-xl border border-gray-200 hover:border-purple-200 hover:bg-purple-50/50 transition-all duration-200 transform hover:scale-[1.02]"
          >
            Oui
          </button>
          <button
            onClick={() => onAnswer(question.nextIfNo || '')}
            className="px-6 py-4 text-center bg-white rounded-xl border border-gray-200 hover:border-purple-200 hover:bg-purple-50/50 transition-all duration-200 transform hover:scale-[1.02]"
          >
            Non
          </button>
        </div>
      );
    }

    if (question.type === 'choice' && question.options?.length) {
      return (
        <div className="space-y-4">
          {question.options.map((option, index) => (
            <button
              key={index}
              onClick={() => onAnswer(option)}
              className="w-full px-6 py-4 text-left bg-white rounded-xl border border-gray-200 hover:border-purple-200 hover:bg-purple-50/50 transition-all duration-200 transform hover:scale-[1.02]"
            >
              {option}
            </button>
          ))}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">
        {question.question}
      </h2>
      {renderOptions()}
    </div>
  );
};

export default QuestionCard;