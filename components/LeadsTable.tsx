import React, { useMemo, useState } from 'react';
import { Lead } from '../types';
import { supabase } from '../lib/supabase';
import DeleteIcon from './icons/DeleteIcon';
import AdminLeadFormModal from './AdminLeadFormModal';
import { useLanguage } from './LanguageContext';

interface LeadsTableProps {
    leads: Lead[];
    onRefresh?: () => void;
    onUpdateUrl: (leadId: number, newUrl: string) => Promise<void>;
}

const LeadsTable: React.FC<LeadsTableProps> = ({ leads, onRefresh, onUpdateUrl }) => {
    const { t, language } = useLanguage();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editUrl, setEditUrl] = useState('');

    const handleEditClick = (lead: Lead) => {
        setEditingId(lead.id);
        setEditUrl(lead.store_url || '');
    };

    const handleSaveClick = async (leadId: number) => {
        await onUpdateUrl(leadId, editUrl);
        setEditingId(null);
    };

    const handleCancelClick = () => {
        setEditingId(null);
        setEditUrl('');
    };

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
        <div className="bg-metallic-900 p-6 rounded-2xl shadow-xl border border-metallic-800">
            <div className="flex flex-col lg:flex-row justify-between items-center mb-4 gap-4">
                <h2 className="text-xl font-bold text-white">{t('leads_table_title')}</h2>
                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                    <div className="relative flex-1">
                        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-metallic-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                        </svg>
                        <input
                            type="text"
                            placeholder={language === 'tr' ? "İsim, email veya mağaza ara..." : "Search name, email or store..."}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 text-sm bg-metallic-950 border border-metallic-700 text-metallic-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-metallic-900 placeholder-metallic-500"
                        />
                    </div>
                    <div className="flex gap-2 sm:flex-shrink-0">
                        <button
                            onClick={downloadCsv}
                            disabled={filteredLeads.length === 0 || downloading}
                            className="px-4 py-2 text-sm font-medium text-metallic-300 border border-metallic-700 rounded-lg hover:bg-metallic-800 transition-colors disabled:opacity-50"
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
                <table className="w-full text-sm text-left text-metallic-400">
                    <thead className="text-xs text-metallic-300 uppercase bg-metallic-950/50">
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
                                <tr key={lead.id} className="bg-metallic-900 hover:bg-metallic-800/50 border-b border-metallic-800">
                                    <td className="px-6 py-4 font-medium text-white whitespace-nowrap">
                                        <div className="font-semibold">{lead.name}</div>
                                        <div className="font-normal text-metallic-400">{lead.email}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {editingId === lead.id ? (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={editUrl}
                                                    onChange={(e) => setEditUrl(e.target.value)}
                                                    className="w-full px-2 py-1 text-sm bg-metallic-950 border border-metallic-700 text-metallic-200 rounded focus:outline-none focus:border-primary-500"
                                                    placeholder="https://www.etsy.com/shop/..."
                                                />
                                                <button onClick={() => handleSaveClick(lead.id)} className="text-green-500 hover:text-green-400">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414L8.414 15l-4.121-4.121a1 1 0 111.414-1.414L8.414 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                </button>
                                                <button onClick={handleCancelClick} className="text-metallic-500 hover:text-metallic-300">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between group">
                                                {lead.store_url ? (
                                                    <a href={lead.store_url} target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:text-primary-300 hover:underline truncate max-w-[200px]">
                                                        {lead.store_url.replace('https://www.etsy.com/shop/', '')}
                                                    </a>
                                                ) : (
                                                    <span className="text-metallic-600">-</span>
                                                )}
                                                <button
                                                    onClick={() => handleEditClick(lead)}
                                                    className="opacity-0 group-hover:opacity-100 ml-2 text-metallic-500 hover:text-primary-400 transition-opacity"
                                                    title={t('edit')}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                    </svg>
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary-900/30 text-primary-300 border border-primary-900/50">
                                            {lead.selected_package}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">{formatDate(lead.created_at)}</td>
                                    <td className="px-6 py-4 text-center">
                                        <button
                                            onClick={() => handleDelete(lead.id)}
                                            className="p-2 text-metallic-500 hover:text-red-400 rounded-md hover:bg-red-900/20 transition-colors"
                                            aria-label={t('delete')}
                                        >
                                            <DeleteIcon />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="text-center py-8 text-metallic-500">
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
