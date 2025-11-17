

import React, { useState } from 'react';
import { Customer } from '../types';
import { supabase } from '../lib/supabase';
import CustomerFormModal from './CustomerFormModal';
import EditIcon from './icons/EditIcon';
import DeleteIcon from './icons/DeleteIcon';

interface CustomerTableProps {
    customers: Customer[];
    onDataChange: () => void;
}

const statusColors = {
    Active: 'bg-green-100 text-green-800',
    Churned: 'bg-red-100 text-red-800',
    Trial: 'bg-yellow-100 text-yellow-800',
};

const CustomerTable: React.FC<CustomerTableProps> = ({ customers, onDataChange }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

    const filteredCustomers = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddNew = () => {
        setEditingCustomer(null);
        setIsModalOpen(true);
    };

    const handleEdit = (customer: Customer) => {
        setEditingCustomer(customer);
        setIsModalOpen(true);
    };

    const handleDelete = async (customerId: number) => {
        if (window.confirm('Bu müşteriyi silmek istediğinizden emin misiniz?')) {
            const { error } = await supabase.from('customers').delete().eq('id', customerId);
            if (error) {
                alert('Müşteri silinirken hata oluştu: ' + error.message);
            } else {
                onDataChange();
            }
        }
    };

    const handleSave = () => {
        setIsModalOpen(false);
        setEditingCustomer(null);
        onDataChange();
    };

    return (
        <>
            <div className="bg-white p-6 rounded-2xl shadow-xl h-full">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                    <h2 className="text-xl font-bold text-slate-800">Müşteriler</h2>
                    <div className="flex items-center space-x-2 w-full sm:w-auto">
                        <div className="relative flex-grow">
                             <input
                                type="text"
                                placeholder="Müşteri ara..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-4 pr-10 py-2.5 text-sm bg-slate-100 border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 focus:bg-white"
                            />
                        </div>
                         <button onClick={handleAddNew} className="px-5 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                            Yeni Ekle
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-500">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 rounded-l-lg">İsim</th>
                                <th scope="col" className="px-6 py-3">Durum</th>
                                <th scope="col" className="px-6 py-3">Plan</th>
                                <th scope="col" className="px-6 py-3 text-right">Harcanan</th>
                                <th scope="col" className="px-6 py-3 text-center rounded-r-lg">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCustomers.map((customer) => (
                                <tr key={customer.id} className="bg-white hover:bg-slate-50">
                                    <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap border-b border-slate-100">
                                        <div className="flex items-center">
                                            <img className="w-10 h-10 rounded-full" src={customer.avatar} alt={`${customer.name} avatar`} />
                                            <div className="pl-3">
                                                <div className="text-base font-semibold">{customer.name}</div>
                                                <div className="font-normal text-slate-500">{customer.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 border-b border-slate-100">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[customer.status]}`}>
                                            {customer.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 border-b border-slate-100">{customer.plan}</td>
                                    <td className="px-6 py-4 text-right font-medium border-b border-slate-100">${customer.spent.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-center border-b border-slate-100">
                                        <div className="flex justify-center space-x-2">
                                            <button onClick={() => handleEdit(customer)} className="p-2 text-slate-500 hover:text-primary-600 rounded-md hover:bg-slate-100 transition-colors"><EditIcon/></button>
                                            <button onClick={() => handleDelete(customer.id!)} className="p-2 text-slate-500 hover:text-red-600 rounded-md hover:bg-red-100 transition-colors"><DeleteIcon/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {isModalOpen && (
                <CustomerFormModal
                    customer={editingCustomer}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                />
            )}
        </>
    );
};

export default CustomerTable;