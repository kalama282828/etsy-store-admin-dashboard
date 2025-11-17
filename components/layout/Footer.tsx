import React from 'react';

interface FooterProps {
    text?: string | null;
}

const Footer: React.FC<FooterProps> = ({ text }) => {
    return (
        <footer className="bg-slate-900 text-slate-300 text-center py-6 text-sm">
            <div className="max-w-5xl mx-auto px-4">
                <p>{text?.trim() || '© 2025 Etsy Admin Dashboard. Tüm hakları saklıdır.'}</p>
            </div>
        </footer>
    );
};

export default Footer;
