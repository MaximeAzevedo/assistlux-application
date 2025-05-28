import React from 'react';
import { useTranslation } from 'react-i18next';
import DocumentScanner from '../components/DocumentScanner';

const ScanPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <DocumentScanner />
    </main>
  );
};

export default ScanPage;