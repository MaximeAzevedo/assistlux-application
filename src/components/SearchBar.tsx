import React from 'react';
import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const SearchBar: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-white/70" />
      </div>
      <input
        type="text"
        className="block w-full pl-10 pr-3 py-3 bg-white/10 border border-white/20 rounded-xl placeholder-white/70 text-white focus:outline-none focus:ring-2 focus:ring-white/25"
        placeholder={t('searchBanner.placeholder')}
      />
    </div>
  );
};

export default SearchBar;