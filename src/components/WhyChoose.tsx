import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { FileText, Lock, Zap, Globe2 } from 'lucide-react';

const WhyChoose: React.FC = () => {
  const { t } = useTranslation();

  return (
    <section className="py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-violet-50/30 to-transparent pointer-events-none"></div>
          
          {/* Title & Subtitle */}
          <div className="text-center mb-12 relative z-10">
            <h2 className="mb-4">
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {t('why.title')}
              </div>
            </h2>
            <p className="text-lg font-light text-gray-600 leading-relaxed tracking-wide">
              {t('why.subtitle')}
            </p>
          </div>

          {/* 2×2 Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 relative z-10">
            {/* Help Block */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <FileText className="w-8 h-8 text-purple-600 mb-4 transform group-hover:scale-110 transition-transform duration-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t('why.benefits.help.title')}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {t('why.benefits.help.text')}
              </p>
            </div>

            {/* Anonymous Block */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <Lock className="w-8 h-8 text-purple-600 mb-4 transform group-hover:scale-110 transition-transform duration-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t('why.benefits.anonymous.title')}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {t('why.benefits.anonymous.text')}
              </p>
            </div>

            {/* Free Block */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <Zap className="w-8 h-8 text-purple-600 mb-4 transform group-hover:scale-110 transition-transform duration-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t('why.benefits.free.title')}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {t('why.benefits.free.text')}
              </p>
            </div>

            {/* Multilingual Block */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <Globe2 className="w-8 h-8 text-purple-600 mb-4 transform group-hover:scale-110 transition-transform duration-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t('why.benefits.multi.title')}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {t('why.benefits.multi.text')}
              </p>
            </div>
          </div>

          {/* Call-out Footer */}
          <div className="text-center mb-8 relative z-10">
            <p className="text-gray-600 leading-relaxed max-w-2xl mx-auto font-light">
              {t('why.cta.text')}
            </p>
          </div>

          {/* CTA Button */}
          <div className="flex justify-center relative z-10">
            <Link
              to="/contact"
              className="relative inline-flex items-center px-8 py-3 bg-gradient-to-r from-purple-600 via-primary to-pink-600 text-white text-center rounded-full font-medium hover:shadow-xl transition-all duration-300 transform hover:scale-105 group overflow-hidden"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
              <span className="relative z-10">{t('why.cta.button')}</span>
            </Link>
          </div>

          {/* Background Accents */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-violet-200/10 via-fuchsia-200/5 to-transparent rounded-full transform translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-purple-200/10 via-violet-200/5 to-transparent rounded-full transform -translate-x-1/2 translate-y-1/2"></div>
        </div>
      </div>
    </section>
  );
};

export default WhyChoose;