import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, DollarSign, Home, Receipt, Clock, FileText } from 'lucide-react';

const procedures = [
  {
    id: 'revis',
    name: 'REVIS',
    description: 'Revenu d\'inclusion sociale - Aide financière mensuelle',
    icon: DollarSign,
    steps: 6,
    duration: '30-45 min',
    documents: 8,
    color: 'bg-purple-100 text-purple-600'
  },
  {
    id: 'logement-social', 
    name: 'Logement social',
    description: 'Demande de logement à loyer modéré',
    icon: Home,
    steps: 8,
    duration: '45-60 min',
    documents: 12,
    color: 'bg-blue-100 text-blue-600'
  },
  {
    id: 'allocation-vie-chere',
    name: 'Allocation de vie chère',
    description: 'Aide pour faire face à l\'augmentation des prix',
    icon: Receipt,
    steps: 4,
    duration: '20-30 min',
    documents: 5,
    color: 'bg-green-100 text-green-600'
  }
];

const ProceduresGuide: React.FC = () => {
  const navigate = useNavigate();

  const handleProcedureSelect = (procedureId: string) => {
    navigate(`/effectuer-demarche/${procedureId}`);
  };

  return (
    <div className="min-h-screen bg-white pt-20 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Choisissez votre démarche
          </h1>
          <p className="text-gray-600">
            Sélectionnez la procédure pour laquelle vous avez besoin d'aide
          </p>
        </div>

        <div className="space-y-4">
          {procedures.map((procedure) => {
            const Icon = procedure.icon;
            return (
              <button
                key={procedure.id}
                onClick={() => handleProcedureSelect(procedure.id)}
                className="w-full bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-200 text-left"
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${procedure.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {procedure.name}
                    </h3>
                    <p className="text-gray-600 text-sm mb-3">
                      {procedure.description}
                    </p>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{procedure.steps} étapes</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {procedure.duration}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        {procedure.documents} documents
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center text-purple-600">
                    <span className="hidden sm:inline mr-2">Commencer</span>
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProceduresGuide;