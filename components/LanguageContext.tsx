import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { translations, Lang, t as translate } from '../i18n';

interface LanguageContextType {
    language: Lang;
    setLanguage: (lang: Lang) => void;
    t: (key: keyof typeof translations['tr'], vars?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<Lang>('tr');

    const t = (key: keyof typeof translations['tr'], vars?: Record<string, string | number>) => {
        return translate(language, key, vars);
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
