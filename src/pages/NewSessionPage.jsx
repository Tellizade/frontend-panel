// src/pages/NewSessionPage.jsx

import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/apiClient';
import { toast } from 'react-toastify';

function NewSessionPage() {
    const { congressId } = useParams(); // Hangi kongreye ait olduğunu URL'den alıyoruz
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [formData, setFormData] = useState({
        title: '',
        session_date: '',
        start_time: '',
        end_time: '',
        location: '',
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Backend'e yeni oturumu kaydetmek için istek gönderiyoruz
            await apiClient.post(`/congresses/${congressId}/sessions`, formData);
            
            // Kongre detay sayfasındaki oturum listesinin bayatladığını bildiriyoruz
            queryClient.invalidateQueries({ queryKey: ['sessions', congressId] });
            
            toast.success('Oturum başarıyla oluşturuldu!');
            
            // Kullanıcıyı bir önceki sayfaya (kongre detay) geri yönlendir
            navigate(`/dashboard/congresses/${congressId}`);
        } catch (err) {
            toast.error('Oturum oluşturulamadı. Lütfen tüm alanları doldurun.');
        }
    };

    const inputClasses = "shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline";

    return (
        <div className="container mx-auto p-4 md:p-8">
            <h1 className="text-3xl font-bold mb-6">Yeni Oturum Oluştur</h1>
            <div className="bg-white p-8 rounded-lg shadow-md max-w-2xl mx-auto">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">Oturum Başlığı</label>
                        <input name="title" value={formData.title} onChange={handleChange} className={inputClasses} required />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">Tarih</label>
                            <input name="session_date" type="date" value={formData.session_date} onChange={handleChange} className={inputClasses} required />
                        </div>
                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">Başlangıç Saati</label>
                            <input name="start_time" type="time" value={formData.start_time} onChange={handleChange} className={inputClasses} required />
                        </div>
                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">Bitiş Saati</label>
                            <input name="end_time" type="time" value={formData.end_time} onChange={handleChange} className={inputClasses} required />
                        </div>
                    </div>
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">Yer (Salon Adı / Online Link)</label>
                        <input name="location" value={formData.location} onChange={handleChange} className={inputClasses} />
                    </div>
                    <div className="flex justify-end pt-4 space-x-4">
                        <Link to={`/dashboard/congresses/${congressId}`}>
                            <button type="button" className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
                                İptal
                            </button>
                        </Link>
                        <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                            Oturumu Oluştur
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default NewSessionPage;