import React, { useState } from 'react';
import { Upload, Database, Check, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ServiceSocial {
  name: string;
  service_type: string;
  category: string;
  address: string;
  phone: string;
  website: string;
  email: string;
  hours: string;
  informations: string;
  keywords?: string;
  commune?: string;
}

const ServiceImporter: React.FC = () => {
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [importMessage, setImportMessage] = useState('');
  const [importedCount, setImportedCount] = useState(0);

  const extractCommune = (address: string): string => {
    // Extraire la commune de l'adresse (format "L-XXXX Commune")
    const match = address.match(/L-\d{4}\s+([^,]+)/);
    return match ? match[1].trim() : '';
  };

  const generateKeywords = (service: ServiceSocial): string => {
    const keywords = [
      service.name.toLowerCase(),
      service.service_type.toLowerCase(),
      service.category.toLowerCase(),
      service.address.toLowerCase(),
      extractCommune(service.address).toLowerCase()
    ];
    
    // Ajouter des mots-clés spécifiques selon le type
    if (service.service_type.includes('Épicerie')) {
      keywords.push('épicerie sociale', 'aide alimentaire', 'prix réduit', 'buttek');
    }
    if (service.service_type.includes('Restaurant')) {
      keywords.push('restaurant social', 'repas chaud', 'sans abri');
    }
    if (service.category.includes('Hébergement')) {
      keywords.push('hébergement', 'logement', 'urgence');
    }
    
    return keywords.filter(k => k.length > 0).join(' ');
  };

  const parseCSVData = (): ServiceSocial[] => {
    // Données directement extraites du CSV fourni par l'utilisateur
    const services: ServiceSocial[] = [
      {
        name: "Croix-Rouge Buttek Kanton Réimech",
        service_type: "Épicerie sociale",
        category: "Alimentation, Besoins Essentiels",
        address: "rue Foascht à Remich",
        phone: "2755",
        website: "www.croix-rouge.lu/fr/service/les-croix-rouge-buttek/",
        email: "buttek.remich@croix-rouge.lu",
        hours: "Horaires analogues aux autres Croix-Rouge Buttek",
        informations: "Fournit des aides alimentaires et matérielles aux personnes détectées comme étant dans le besoin par les assistants sociaux des deux offices. Objectifs : lutter contre la pauvreté des ménages défavorisés en augmentant leur pouvoir d'achat, lutter contre le gaspillage des denrées alimentaires, permettre une nutrition équilibrée des populations défavorisées."
      },
      {
        name: "Croix-Rouge Buttek Differdange",
        service_type: "Épicerie sociale",
        category: "Alimentation",
        address: "19, Grand-Rue, L-4575 Differdange",
        phone: "35227555030",
        website: "www.croix-rouge.lu/fr/service/les-croix-rouge-buttek/",
        email: "buttek.differdange@croix-rouge.lu",
        hours: "Lundi, Mercredi, Jeudi, Vendredi: 09h30 - 12h30 & 13h30 - 17h00; Mardi: 09h30 - 12h30 & 13h30 - 19h00; Samedi, Dimanche: fermé",
        informations: "Accès sur dossier, via les offices sociaux ou le service social de la Croix-Rouge Luxembourgeoise. Aide temporaire. Fait partie d'un réseau de 8 Butteker gérés par la Croix-Rouge. Les créneaux tardifs le mardi facilitent l'accès aux travailleurs pauvres."
      },
      {
        name: "Croix-Rouge Buttek Echternach",
        service_type: "Épicerie sociale",
        category: "Alimentation",
        address: "9, rue André Duchscher, L-6434 Echternach",
        phone: "3522755",
        website: "www.croix-rouge.lu/fr/service/les-croix-rouge-buttek/",
        email: "buttek.echternach@croix-rouge.lu",
        hours: "Lundi: 13h00 - 17h00; Mardi, Samedi, Dimanche: fermé; Mercredi, Jeudi: 09h30 - 12h30 & 13h30 - 17h00; Vendredi: 09h30 - 12h30 & 13h30 - 19h00",
        informations: "Accès sur dossier, via les offices sociaux ou le service social de la Croix-Rouge Luxembourgeoise. Fait partie d'un réseau de 8 Butteker gérés par la Croix-Rouge."
      },
      {
        name: "Croix-Rouge Buttek Grevenmacher",
        service_type: "Épicerie sociale",
        category: "Alimentation",
        address: "13, route de Thionville, L-6791 Grevenmacher",
        phone: "35227555080",
        website: "www.croix-rouge.lu/fr/service/les-croix-rouge-buttek/",
        email: "buttek.grevenmacher@croix-rouge.lu",
        hours: "Lundi, Vendredi: 13h30 - 18h00; Mardi: 09h00 - 12h00; Mercredi: 10h30 - 12h30 & 13h30 - 19h00; Jeudi, Samedi, Dimanche: fermé",
        informations: "Accès sur dossier, via les offices sociaux ou le service social de la Croix-Rouge Luxembourgeoise. Fait partie d'un réseau de 8 Butteker gérés par la Croix-Rouge. Les créneaux tardifs le mercredi et vendredi facilitent l'accès aux travailleurs pauvres."
      },
      {
        name: "Croix-Rouge Buttek Mersch",
        service_type: "Épicerie sociale",
        category: "Alimentation",
        address: "35, rue de la Gare, L-7535 Mersch",
        phone: "35227555050",
        website: "www.croix-rouge.lu/fr/service/les-croix-rouge-buttek/",
        email: "buttek.mersch@croix-rouge.lu",
        hours: "Lundi: 13h00 - 17h30; Mardi, Vendredi: 10h00 - 12h30 & 13h30 - 17h30; Mercredi, Samedi, Dimanche: fermé; Jeudi: 10h00 - 12h30 & 13h30 - 19h00",
        informations: "Accès sur dossier, via les offices sociaux ou le service social de la Croix-Rouge Luxembourgeoise. Fait partie d'un réseau de 8 Butteker gérés par la Croix-Rouge. Les créneaux tardifs le jeudi et vendredi facilitent l'accès aux travailleurs pauvres."
      },
      {
        name: "Caritas Buttek Esch-sur-Alzette",
        service_type: "Épicerie sociale",
        category: "Alimentation",
        address: "79, rue Dicks, L-4082 Esch-sur-Alzette (situé au Caritas Fairness Center)",
        phone: "352402131904",
        website: "www.caritas.lu",
        email: "caritasbuttek@caritas.lu",
        hours: "Lundi, Mercredi: 13h30 - 16h30; Mardi, Jeudi: 10h00 - 12h00 & 13h30 - 16h30; Vendredi: 13h30 - 18h00; Samedi, Dimanche: fermé",
        informations: "Accès via une carte délivrée par Caritas ou les offices sociaux, sous conditions de revenus. Un accompagnement social est proposé. Fait partie d'un réseau de 4 Butteker gérés par Caritas. Objectifs : lutter contre la pauvreté, la nutrition équilibrée et le lien social."
      },
      {
        name: "Caritas Buttek Diekirch",
        service_type: "Épicerie sociale",
        category: "Alimentation",
        address: "20, route d'Ettelbrück, L-9230 Diekirch",
        phone: "352402131918",
        website: "www.caritas.lu",
        email: "caritasbuttek@caritas.lu",
        hours: "Lundi - Vendredi: 11h00 - 13h00 & 14h00 - 17h30; Samedi, Dimanche: fermé",
        informations: "Accès via une carte délivrée par Caritas ou les offices sociaux, sous conditions de revenus. Un accompagnement social est proposé. Fait partie d'un réseau de 4 Butteker gérés par Caritas. Objectifs : lutter contre la pauvreté, la nutrition équilibrée et le lien social."
      },
      {
        name: "Caritas Buttek Redange/Attert",
        service_type: "Épicerie sociale",
        category: "Alimentation",
        address: "32, Grand-Rue, L-8510 Redange-sur-Attert",
        phone: "352402131547",
        website: "www.caritas.lu",
        email: "caritasbuttek@caritas.lu",
        hours: "Lundi: 13h00 - 18h30; Mardi, Jeudi, Vendredi: 13h00 - 17h00; Mercredi, Samedi, Dimanche: fermé",
        informations: "Accès via une carte délivrée par Caritas ou les offices sociaux, sous conditions de revenus. Un accompagnement social est proposé. Fait partie d'un réseau de 4 Butteker gérés par Caritas. Objectifs : lutter contre la pauvreté, la nutrition équilibrée et le lien social."
      },
      {
        name: "Cent Buttek Beggen",
        service_type: "Épicerie sociale",
        category: "Alimentation",
        address: "2, rue de Neuerburg, L-1620 Luxembourg (Beggen)",
        phone: "35227397902",
        website: "www.centbuttek.lu",
        email: "info@abh.lu",
        hours: "Lundi, Mercredi: 14h00 - 18h00; Mardi, Jeudi, Samedi, Dimanche: fermé; Vendredi: 11h00 - 15h00",
        informations: "Association gérant 3 épiceries solidaires locales ouvertes à tous, alimentées par les collectes de produits invendus des supermarchés. Fonctionne grâce à ~160 bénévoles. Pour personnes et familles à faible revenu, sur présentation d'une carte d'accès délivrée par les offices sociaux ou associations partenaires."
      },
      {
        name: "Cent Buttek Bettembourg",
        service_type: "Épicerie sociale",
        category: "Alimentation",
        address: "12, rue de la Gare, L-3236 Bettembourg",
        phone: "35226512093",
        website: "www.centbuttek.lu",
        email: "CBBet@pt.lu",
        hours: "Mardi, Vendredi: 14h00 - 18h00",
        informations: "Association gérant 3 épiceries solidaires locales ouvertes à tous, alimentées par les collectes de produits invendus des supermarchés. Pour personnes des communes de Bettembourg, Dudelange, Frisange, Roeser, Hesperange, Kayl-Tétange, Rumelange, via les Offices sociaux compétents."
      },
      {
        name: "Stëmm vun der Strooss - Luxembourg-Hollerich",
        service_type: "Centre d'accueil de jour, Repas sociaux, Réinsertion",
        category: "Alimentation",
        address: "7, rue de la Fonderie, L-1531 Luxembourg",
        phone: "352490260",
        website: "www.stemm.lu",
        email: "info@stemm.lu",
        hours: "Restaurant social: Lundi à Vendredi: 11h30 - 15h30. Samedi (2ème et 4ème du mois): 11h30 - 13h30",
        informations: "Offre des lieux de rencontre de jour pour personnes sans-abri ou en grande précarité, avec repas chauds à prix symbolique (0,50 € le repas, 0,25 € la boisson). Propose douches, consigne et activités de réinsertion. A servi 243 619 repas en 2024."
      },
      {
        name: "Stëmm vun der Strooss - Esch-sur-Alzette",
        service_type: "Centre d'accueil de jour, Repas sociaux, Réinsertion",
        category: "Alimentation",
        address: "112, Rue du Canal, L-4051 Esch-sur-Alzette",
        phone: "352265422",
        website: "www.stemm.lu",
        email: "info@stemm.lu",
        hours: "Restaurant Social: Lundi à Vendredi: 11h30 - 15h00. Distribution de repas: Dimanche (2ème et 4ème du mois): 11h30 - 13h30",
        informations: "Offre des lieux de rencontre de jour pour personnes sans-abri ou en grande précarité. Repas chauds à prix symbolique. Propose douches, consigne et activités de réinsertion. Gère des ateliers de réinsertion comme la blanchisserie Schweesdrëps."
      },
      {
        name: "Wanteraktioun (WAK)",
        service_type: "Aide hivernale d'urgence",
        category: "Alimentation, Hébergement",
        address: "2 b, rue de Trèves, L-2632 Findel",
        phone: "+352 621 148 508",
        website: "www.croix-rouge.lu",
        email: "wanteraktioun@draieck.lu",
        hours: "Annuellement du 15 novembre au 15 avril. Ouvert 24h/24 en hiver. Foyer de jour: 12h-16h avec repas chauds servis",
        informations: "Action humanitaire visant à éviter que des personnes sans-abri ne souffrent d'hypothermie. Propose un hébergement d'urgence pour la nuit, ainsi que le petit-déjeuner et le dîner. A servi 74 804 repas à 2 218 bénéficiaires différents sur 157 nuits durant la saison 2023/2024."
      },
      {
        name: "Banque Alimentaire Luxembourg asbl",
        service_type: "Banque alimentaire",
        category: "Alimentation",
        address: "40, Boulevard Napoléon 1er, L-2210 Luxembourg",
        phone: "+352 621 142 980",
        website: "www.banquealimentaire.lu",
        email: "president@banquealimentaire.lu",
        hours: "Horaires administratifs variables. Pas d'accueil direct du public",
        informations: "Mission principale : lutter contre le gaspillage alimentaire et la précarité en collectant des surplus alimentaires. Ne fournit pas d'aide directement aux particuliers, mais approvisionne un réseau d'associations caritatives agréées et d'offices sociaux. Collecte environ 70 tonnes de denrées annuellement."
      },
      {
        name: "ASTI asbl - Restaurant social",
        service_type: "Restaurant social",
        category: "Alimentation",
        address: "10-12, rue Auguste Laval, L-1922 Luxembourg",
        phone: "352 43 83 33-1",
        website: "www.asti.lu",
        email: "info@asti.lu",
        hours: "Généralement ouvert pour le déjeuner en semaine (12h00 - 14h00)",
        informations: "Ouvert à tous, particulièrement pour personnes à faible revenu, étudiants, travailleurs immigrés. Fournit des bons d'achat utilisables dans les épiceries sociales pour les ressortissants de pays tiers en situation de séjour irrégulier."
      }
    ];

    return services;
  };

  const handleImport = async () => {
    setIsImporting(true);
    setImportStatus('idle');
    setImportMessage('');
    setImportedCount(0);

    try {
      const services = parseCSVData();
      
      // Vider la table existante
      const { error: deleteError } = await supabase
        .from('services_sociaux')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (deleteError) {
        throw new Error(`Erreur lors de la suppression des données existantes: ${deleteError.message}`);
      }

      // Préparer les données avec mots-clés et commune
      const servicesWithMetadata = services.map(service => ({
        ...service,
        keywords: generateKeywords(service),
        commune: extractCommune(service.address)
      }));

      // Insérer les nouveaux services par batch
      const batchSize = 10;
      let totalImported = 0;

      for (let i = 0; i < servicesWithMetadata.length; i += batchSize) {
        const batch = servicesWithMetadata.slice(i, i + batchSize);
        
        const { error: insertError } = await supabase
          .from('services_sociaux')
          .insert(batch);

        if (insertError) {
          throw new Error(`Erreur lors de l'insertion du batch ${Math.floor(i/batchSize) + 1}: ${insertError.message}`);
        }

        totalImported += batch.length;
        setImportedCount(totalImported);
      }

      setImportStatus('success');
      setImportMessage(`✅ ${totalImported} services importés avec succès !`);

    } catch (error) {
      console.error('Erreur lors de l\'importation:', error);
      setImportStatus('error');
      setImportMessage(`❌ Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-3 mb-6">
        <Database className="h-6 w-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">
          Import des Services Sociaux
        </h2>
      </div>

      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">
            📊 Données à importer
          </h3>
          <p className="text-blue-700 text-sm">
            Import des services sociaux luxembourgeois : épiceries sociales, restaurants sociaux, 
            banques alimentaires, aide hivernale d'urgence, etc.
          </p>
          <div className="mt-2 text-sm text-blue-600">
            • ~15 services répertoriés<br/>
            • Informations complètes (adresses, horaires, contacts)<br/>
            • Système de recherche optimisé
          </div>
        </div>

        <button
          onClick={handleImport}
          disabled={isImporting}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium 
                     hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed
                     flex items-center justify-center gap-2 transition-colors"
        >
          {isImporting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Import en cours... ({importedCount} services)
            </>
          ) : (
            <>
              <Upload className="h-5 w-5" />
              Importer les Services Sociaux
            </>
          )}
        </button>

        {importMessage && (
          <div className={`p-4 rounded-lg flex items-center gap-2 ${
            importStatus === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800'
              : importStatus === 'error'
              ? 'bg-red-50 border border-red-200 text-red-800'
              : 'bg-blue-50 border border-blue-200 text-blue-800'
          }`}>
            {importStatus === 'success' && <Check className="h-5 w-5" />}
            {importStatus === 'error' && <AlertCircle className="h-5 w-5" />}
            <span className="font-medium">{importMessage}</span>
          </div>
        )}

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">
            🔍 Après l'import
          </h4>
          <p className="text-gray-600 text-sm">
            Les services seront recherchables par nom, type, catégorie, commune, 
            mots-clés et contenu. Le système de scoring intelligent privilégie 
            la pertinence des résultats.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ServiceImporter; 