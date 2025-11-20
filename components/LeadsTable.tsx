import React, { useMemo, useState } from 'react';
import { Lead } from '../types';
import { supabase } from '../lib/supabase';
import DeleteIcon from './icons/DeleteIcon';
import AdminLeadFormModal from './AdminLeadFormModal';
import { useLanguage } from './LanguageContext';

interface LeadsTableProps {
    leads: Lead[];
    onRefresh?: () => void;
}

const LeadsTable: React.FC<LeadsTableProps> = ({ leads, onRefresh }) => {
    const { t, language } = useLanguage();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [downloading, setDownloading] = useState(false);

    const filteredLeads = useMemo(() => leads.filter(lead =>
        (lead.name && lead.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lead.email && lead.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lead.store_url && lead.store_url.toLowerCase().includes(searchTerm.toLowerCase()))
    ), [leads, searchTerm]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString(language === 'tr' ? 'tr-TR' : 'en-US', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const handleDelete = async (leadId: number) => {
        if (!window.confirm(language === 'tr' ? 'Bu lead kaydını silmek istediğinizden emin misiniz?' : 'Are you sure you want to delete this lead?')) return;
        const { error } = await supabase.from('leads').delete().eq('id', leadId);
        if (error) {
            alert(`${t('error')}: ${error.message}`);
        } else {
            onRefresh?.();
        }
    };

    const downloadCsv = () => {
        if (filteredLeads.length === 0) return;
        setDownloading(true);
        const headers = language === 'tr'
            ? ['İsim', 'E-posta', 'Mağaza URL', 'Paket', 'Tarih']
            : ['Name', 'Email', 'Store URL', 'Package', 'Date'];

        const rows = filteredLeads.map(lead => [
            lead.name || '',
            lead.email || '',
            lead.store_url || '',
            lead.selected_package || '',
            lead.created_at ? formatDate(lead.created_at) : ''
        ]);

        const csvContent = [headers, ...rows]
            .map(row => row.map(col => `"${(col || '').replace(/"/g, '""')}"`).join(','))
            .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
        setDownloading(false);
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-xl">
            <div className="flex flex-col lg:flex-row justify-between items-center mb-4 gap-4">
                <h2 className="text-xl font-bold text-slate-800">{t('leads_table_title')}</h2>
                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                    <div className="relative flex-1">
                        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                        </svg>
                        <input
                            type="text"
                            placeholder={language === 'tr' ? "İsim, email veya mağaza ara..." : "Search name, email or store..."}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-100 border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 focus:bg-white"
                        />
                    </div>
                    <div className="flex gap-2 sm:flex-shrink-0">
                        <button
                            onClick={downloadCsv}
                            disabled={filteredLeads.length === 0 || downloading}
                            className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
                        >
                            {downloading ? t('loading') : '.CSV'}
                        </button>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
                        >
                            {language === 'tr' ? 'Yeni Lead' : 'New Lead'}
                        </button>
                    </div>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-500">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 rounded-l-lg">{t('leads_table_name')}</th>
                            <th scope="col" className="px-6 py-3">{t('user_table_store')}</th>
                            <th scope="col" className="px-6 py-3">{t('leads_table_package')}</th>
                            <th scope="col" className="px-6 py-3">{t('leads_table_date')}</th>
                            <th scope="col" className="px-6 py-3 text-center rounded-r-lg">{t('user_table_actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredLeads.length > 0 ? (
                            filteredLeads.map((lead) => (
                                <tr key={lead.id} className="bg-white hover:bg-slate-50">
                                    <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap border-b border-slate-100">
                                        <div className="font-semibold">{lead.name}</div>
                                        <div className="font-normal text-slate-500">{lead.email}</div>
                                    </td>
                                    <td className="px-6 py-4 border-b border-slate-100">
                                        {lead.store_url ? (
                                            <a href={lead.store_url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                                                {lead.store_url.replace('https://www.etsy.com/shop/', '')}
                                            </a>
                                        ) : (
                                            <span className="text-slate-400">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 border-b border-slate-100">
                                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary-100 text-primary-800">
                                            {lead.selected_package}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 border-b border-slate-100">{formatDate(lead.created_at)}</td>
                                    <td className="px-6 py-4 border-b border-slate-100 text-center">
                                        <button
                                            onClick={() => handleDelete(lead.id)}
                                            className="p-2 text-slate-500 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
                                            aria-label={t('delete')}
                                        >
                                            <DeleteIcon />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="text-center py-8 text-slate-500">
                                    {leads.length === 0
                                        ? (language === 'tr' ? "Henüz müşteri adayı bulunmuyor." : "No leads yet.")
                                        : (language === 'tr' ? "Aramanızla eşleşen sonuç bulunamadı." : "No leads found matching your search.")}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {isModalOpen && (
                <AdminLeadFormModal
                    onClose={() => setIsModalOpen(false)}
                    onSaved={onRefresh || (() => undefined)}
                />
            )}
        </div>
    );
};

export default LeadsTable;
