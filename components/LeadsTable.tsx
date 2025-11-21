import React, { useState } from 'react';
import { Lead } from '../types';
import { useLanguage } from './LanguageContext';
import { supabase } from '../lib/supabase';

interface LeadsTableProps {
    leads: Lead[];
    onUpdateUrl: (leadId: number, newUrl: string) => void;
}

const LeadsTable: React.FC<LeadsTableProps> = ({ leads, onUpdateUrl }) => {
    const { t, language } = useLanguage();
    const [searchTerm, setSearchTerm] = useState('');
    const [downloading, setDownloading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newLead, setNewLead] = useState({ name: '', email: '', package_name: 'Starter' });
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editUrl, setEditUrl] = useState('');

    const filteredLeads = leads.filter(lead =>
        (lead.name && lead.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lead.email && lead.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lead.store_url && lead.store_url.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const downloadCSV = () => {
        setDownloading(true);
        try {
            const headers = ['Name', 'Email', 'Package', 'Date', 'Store URL'];
            const csvContent = [
                headers.join(','),
                ...filteredLeads.map(lead => [
                    `"${lead.name}"`,
                    lead.email,
                    lead.selected_package,
                    new Date(lead.created_at).toLocaleDateString(),
                    lead.store_url || ''
                ].join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'leads.csv');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Error downloading CSV:', error);
        } finally {
            setDownloading(false);
        }
    };

    const handleCreateLead = async (e: React.FormEvent) => {
        e.preventDefault();
        // Implementation for creating lead would go here
        // For now just close modal
        setIsModalOpen(false);
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm(t('delete_confirm'))) return;

        try {
            const { error } = await supabase.from('leads').delete().eq('id', id);
            if (error) throw error;
            // Parent component should handle refresh or we can update local state if we lift state up properly
            window.location.reload(); // Temporary reload to refresh data
        } catch (error) {
            console.error('Error deleting lead:', error);
            alert(t('error'));
        }
    };

    const handleEditClick = (lead: Lead) => {
        setEditingId(lead.id);
        setEditUrl(lead.store_url || '');
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditUrl('');
    };

    const handleSaveUrl = (leadId: number) => {
        onUpdateUrl(leadId, editUrl);
        setEditingId(null);
    };

    return (
        <div className="bg-metallic-900/50 backdrop-blur-xl border border-white/5 rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
                <h2 className="text-lg font-bold text-white tracking-tight">{t('leads_table_title')}</h2>
                <div className="flex gap-4">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search leads..."
                            className="bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-metallic-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 w-48 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-metallic-500 absolute right-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <button
                        onClick={downloadCSV}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-500/10 text-primary-400 border border-primary-500/20 rounded-xl hover:bg-primary-500/20 transition-all text-sm font-medium"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        CSV
                    </button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-white/5">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-metallic-400 uppercase tracking-wider">{t('leads_table_name')}</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-metallic-400 uppercase tracking-wider">{t('user_table_store')}</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-metallic-400 uppercase tracking-wider">{t('leads_table_package')}</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-metallic-400 uppercase tracking-wider">{t('leads_table_date')}</th>
                            <th className="px-6 py-4 text-center text-xs font-semibold text-metallic-400 uppercase tracking-wider">{t('user_table_actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredLeads.map((lead) => (
                            <tr key={lead.id} className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-metallic-700 to-metallic-800 flex items-center justify-center text-xs font-bold text-white border border-white/10">
                                            {(lead.name || lead.email).charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div>{lead.name || '-'}</div>
                                            <div className="text-xs text-metallic-500">{lead.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-metallic-300">
                                    {editingId === lead.id ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={editUrl}
                                                onChange={(e) => setEditUrl(e.target.value)}
                                                className="bg-black/20 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary-500 w-48"
                                            />
                                            <button onClick={() => handleSaveUrl(lead.id)} className="text-green-400 hover:text-green-300 p-1">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </button>
                                            <button onClick={handleCancelEdit} className="text-red-400 hover:text-red-300 p-1">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between group">
                                            {lead.store_url ? (
                                                <a href={lead.store_url} target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:text-primary-300 hover:underline truncate max-w-[150px]">
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
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-primary-500/10 text-primary-400 border border-primary-500/20">
                                        {lead.selected_package}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-metallic-400">
                                    {formatDate(lead.created_at)}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <button
                                        onClick={() => handleDelete(lead.id)}
                                        className="text-metallic-500 hover:text-red-400 transition-colors p-2 hover:bg-red-500/10 rounded-lg"
                                        title={t('delete')}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredLeads.length === 0 && (
                    <div className="p-8 text-center text-metallic-500">
                        No leads found matching your search.
                    </div>
                )}
            </div>
        </div>
    );
};

export default LeadsTable;
