import React from 'react';
import { useNavigate } from 'react-router-dom';
import * as Icons from 'lucide-react';
import contentData from '../data/content.json';

interface ContentPageProps {
  category: string;
  pageKey: string;
  backLink: string;
  backText: string;
}

const ContentPage: React.FC<ContentPageProps> = ({ category, pageKey, backLink, backText }) => {
  const navigate = useNavigate();
  const page = contentData.pages[category]?.[pageKey];

  if (!page) {
    return <div>Page not found</div>;
  }

  // Dynamically get the icon component
  const IconComponent = Icons[page.icon as keyof typeof Icons];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate(backLink)}
          className="flex items-center text-purple-600 hover:text-purple-700 mb-8"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {backText}
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              {IconComponent && <IconComponent className="w-6 h-6 text-purple-600" />}
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              {page.title}
            </h1>
          </div>

          <div className="prose prose-purple max-w-none">
            <p className="text-gray-700 mb-8">{page.content.intro}</p>

            {page.content.sections.map((section, index) => (
              <div key={index} className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  {section.title}
                </h2>
                <div className="text-gray-700">
                  {section.content}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentPage;