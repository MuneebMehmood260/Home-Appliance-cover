import React, { createContext, useContext, useEffect, useState, useTransition } from 'react';
import { ShopSettings } from '../types';
import { INITIAL_SETTINGS } from '../lib/constants';
import { dbService } from '../lib/supabase';

interface SettingsContextType {
  settings: ShopSettings;
  isLoading: boolean;
  refreshSettings: () => Promise<void>;
  updateSettings: (newSettings: Partial<ShopSettings>) => Promise<ShopSettings>;
  formatCurrency: (amount: number) => string;
  calculateShipping: (subtotal: number) => number;
  getWhatsAppOrderUrl: (message: string) => string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<ShopSettings>(INITIAL_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [, startTransition] = useTransition();

  const refreshSettings = async () => {
    try {
      const data = await dbService.getSettings();
      startTransition(() => {
        setSettings(data);
      });
    } catch (err) {
      console.warn('Error loading settings', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshSettings();
  }, []);

  const updateSettings = async (newSettings: Partial<ShopSettings>) => {
    const updated = await dbService.updateSettings(newSettings);
    setSettings(updated);
    return updated;
  };

  const formatCurrency = (amount: number): string => {
    const symbol = settings.currency_symbol || 'Rs.';
    const formattedNum = Number(amount || 0).toLocaleString('en-PK', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return `${symbol} ${formattedNum}`;
  };

  const calculateShipping = (subtotal: number): number => {
    if (subtotal >= settings.free_delivery_threshold) {
      return 0;
    }
    return settings.standard_delivery_fee;
  };

  const getWhatsAppOrderUrl = (message: string): string => {
    const cleanNumber = (settings.whatsapp_number || '923001234567').replace(/[^0-9]/g, '');
    const encoded = encodeURIComponent(message);
    return `https://wa.me/${cleanNumber}?text=${encoded}`;
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        isLoading,
        refreshSettings,
        updateSettings,
        formatCurrency,
        calculateShipping,
        getWhatsAppOrderUrl,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
