

import React, { useState } from 'react';
import { RegisteredUser } from '../types';

// Fix: Defined the missing UserTableProps interface.
interface UserTableProps {
    users: RegisteredUser[];
}

const UserTable: React.FC<UserTableProps> = ({ users }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredUsers = users.filter(user =>
        (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.etsy_store_url && user.etsy_store_url.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-xl">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                <h2 className="text-xl font-bold text-slate-800">Kayıtlı Kullanıcılar</h2>
                <div className="relative w-full sm:w-auto">
                    <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Kullanıcı veya mağaza ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full sm:w-64 pl-10 pr-4 py-2.5 text-sm bg-slate-100 border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 focus:bg-white"
                    />
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-500">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 rounded-l-lg">Kullanıcı</th>
                            <th scope="col" className="px-6 py-3">Mağaza URL</th>
                            <th scope="col" className="px-6 py-3 rounded-r-lg">Kayıt Tarihi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.length > 0 ? (
                            filteredUsers.map((user) => (
                                <tr key={user.id} className="bg-white hover:bg-slate-50">
                                    <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap border-b border-slate-100">
                                        {user.email}
                                    </td>
                                    <td className="px-6 py-4 border-b border-slate-100">
                                        {user.etsy_store_url ? (
                                            <a href={user.etsy_store_url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                                                {user.etsy_store_url.replace('https://www.etsy.com/shop/', '')}
                                            </a>
                                        ) : (
                                            <span className="text-slate-400">Belirtilmemiş</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 border-b border-slate-100">{formatDate(user.created_at)}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={3} className="text-center py-8 text-slate-500">
                                    {users.length === 0 ? "Henüz kayıtlı kullanıcı bulunmuyor." : "Aramanızla eşleşen kullanıcı bulunamadı."}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UserTable;