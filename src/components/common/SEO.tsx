import { useEffect } from 'react';
import { useSettings } from '../../context/SettingsContext';

interface SEOProps {
  title?: string;
  description?: string;
}

export const SEO: React.FC<SEOProps> = ({ title, description }) => {
  const { settings } = useSettings();

  useEffect(() => {
    const shopName = settings?.shop_name || 'Home Appliance Covers';
    const finalTitle = title ? `${title} | ${shopName}` : `${shopName} | Waterproof & Dustproof Covers`;
    document.title = finalTitle;

    const metaDescription = document.querySelector('meta[name="description"]');
    const finalDesc = description || settings?.hero_subtitle || 'Tailored protective covers for home appliances.';
    if (metaDescription) {
      metaDescription.setAttribute('content', finalDesc);
    }
  }, [title, description, settings]);

  return null;
};
