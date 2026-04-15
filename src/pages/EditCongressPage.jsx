// src/pages/EditCongressPage.jsx

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/apiClient';
import { toast } from 'react-toastify';

function EditCongressPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [formData, setFormData] = useState({
        name: '',
        topic: '',
        start_date: '',
        end_date: '',
        organizer: '',
        fee_presenter: '',
        fee_viewer: '',
        min_abstract_char: 100,
        max_abstract_char: 2000,
        description: ''
    });

    // 1. Mevcut veriyi çek
    const { data: congress, isLoading, error } = useQuery({
        queryKey: ['congress', id],
        queryFn: async () => {
            const res = await apiClient.get(`/congresses/${id}`);
            return res.data;
        }
    });

    // 2. Veri gelince form state'ini doldur
    useEffect(() => {
        if (congress) {
            setFormData({
                name: congress.name || '',
                topic: congress.topic || '',
                organizer: congress.organizer || '',
                start_date: congress.start_date ? congress.start_date.split('T')[0] : '',
                end_date: congress.end_date ? congress.end_date.split('T')[0] : '',
                fee_presenter: congress.fee_presenter ?? '', // Veritabanındaki null değerleri boş string yapar
                fee_viewer: congress.fee_viewer ?? '',
                min_abstract_char: congress.min_abstract_char || 100,
                max_abstract_char: congress.max_abstract_char || 2000,
                description: congress.description || ''
            });
        }
    }, [congress]);

// src/pages/EditCongressPage.jsx içindeki handleSubmit ve Mutation kısmını güncelle:

const updateMutation = useMutation({
    mutationFn: (updatedData) => apiClient.put(`/congresses/${id}`, updatedData),
    onSuccess: async () => {
        // 1. Önce önbellekteki tüm kongre verilerini "geçersiz" (stale) olarak işaretle
        // Bu sayede yönlendiğimiz sayfada veriler baştan çekilir.
        await queryClient.invalidateQueries({ queryKey: ['congresses'] });
        await queryClient.invalidateQueries({ queryKey: ['congress', id] });

        toast.success('Bilgiler güncellendi.', { position: "bottom-center", theme: "dark" });
        
        // Verilerin çekildiğinden emin olmak için 100ms bekleyip öyle yönlendirme yapabiliriz
        setTimeout(() => {
            navigate(`/dashboard/congresses/${id}`);
        }, 100);
    }
});

const handleSubmit = (e) => {
    e.preventDefault();

    // Verileri sayıya (Number) çevirerek gönderiyoruz. 
    // Boş bırakılan alanları veritabanına hata vermemesi için null veya 0 olarak gönderiyoruz.
    const payload = {
        ...formData,
        fee_presenter: formData.fee_presenter !== '' ? Number(formData.fee_presenter) : 0,
        fee_viewer: formData.fee_viewer !== '' ? Number(formData.fee_viewer) : 0,
        min_abstract_char: Number(formData.min_abstract_char),
        max_abstract_char: Number(formData.max_abstract_char)
    };

    updateMutation.mutate(payload);
};

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    if (isLoading) return <div className="p-20 text-center font-serif italic text-slate-500 bg-[#F8FAFC] min-h-screen">Veriler yükleniyor...</div>;
    if (error) return <div className="p-20 text-center font-bold text-rose-700 bg-[#F8FAFC] min-h-screen">Veri çekilirken bir hata oluştu.</div>;

    return (
        <div className="min-h-screen bg-[#F8FAFC] py-12 px-6 font-sans">
            <div className="max-w-3xl mx-auto">
                
                {/* Geri Dönüş Linki */}
                <div className="mb-6 flex justify-between items-end">
                    <Link to={`/dashboard/congresses/${id}`} className="text-xs font-bold text-slate-500 hover:text-slate-900 uppercase tracking-widest transition-colors flex items-center gap-2">
                        <span>&larr;</span> Kongre Detayına Dön
                    </Link>
                </div>

                <div className="bg-white border border-slate-200 shadow-sm rounded-sm overflow-hidden">
                    
                    {/* Form Başlığı */}
                    <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                        <h1 className="text-xl font-serif font-bold text-slate-900 italic">Organizasyon Yapılandırması</h1>
                        <p className="text-[11px] text-slate-500 uppercase tracking-widest mt-1 font-bold">Teknik Bilgileri Güncelle</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-8">
                        
                        {/* --- TEMEL BİLGİLER --- */}
                        <div className="space-y-6">
                            <h2 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 uppercase tracking-wider">I. Temel Bilgiler</h2>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2 flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kongre Tam Adı</label>
                                    <input type="text" name="name" value={formData.name} onChange={handleChange} className="border border-slate-200 p-2.5 rounded-sm focus:border-slate-900 outline-none transition-all text-sm" required />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ana Bilim Dalı / Konu</label>
                                    <input type="text" name="topic" value={formData.topic} onChange={handleChange} className="border border-slate-200 p-2.5 rounded-sm focus:border-slate-900 outline-none transition-all text-sm" required />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Organizatör Kurum</label>
                                    <input type="text" name="organizer" value={formData.organizer} onChange={handleChange} className="border border-slate-200 p-2.5 rounded-sm focus:border-slate-900 outline-none transition-all text-sm" required />
                                </div>
                            </div>
                        </div>

                        {/* --- TARİHLER --- */}
                        <div className="space-y-6">
                            <h2 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 uppercase tracking-wider">II. Takvim</h2>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Başlangıç Tarihi</label>
                                    <input type="date" name="start_date" value={formData.start_date} onChange={handleChange} className="border border-slate-200 p-2.5 rounded-sm focus:border-slate-900 outline-none transition-all text-sm" required />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bitiş Tarihi</label>
                                    <input type="date" name="end_date" value={formData.end_date} onChange={handleChange} className="border border-slate-200 p-2.5 rounded-sm focus:border-slate-900 outline-none transition-all text-sm" required />
                                </div>
                            </div>
                        </div>

                        {/* --- ÜCRETLER VE KURALLAR --- */}
                        <div className="space-y-6">
                            <h2 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 uppercase tracking-wider">III. Maliyet ve Kurallar</h2>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sunucu Ücreti (₺)</label>
                                    <input type="number" name="fee_presenter" value={formData.fee_presenter} onChange={handleChange} className="border border-slate-200 p-2.5 rounded-sm focus:border-slate-900 outline-none transition-all text-sm font-mono" required />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">İzleyici Ücreti (₺)</label>
                                    <input type="number" name="fee_viewer" value={formData.fee_viewer} onChange={handleChange} className="border border-slate-200 p-2.5 rounded-sm focus:border-slate-900 outline-none transition-all text-sm font-mono" required />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bildiri Min. Karakter</label>
                                    <input type="number" name="min_abstract_char" value={formData.min_abstract_char} onChange={handleChange} className="border border-slate-200 p-2.5 rounded-sm focus:border-slate-900 outline-none transition-all text-sm font-mono" required />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bildiri Max. Karakter</label>
                                    <input type="number" name="max_abstract_char" value={formData.max_abstract_char} onChange={handleChange} className="border border-slate-200 p-2.5 rounded-sm focus:border-slate-900 outline-none transition-all text-sm font-mono" required />
                                </div>
                            </div>
                        </div>

                        {/* --- AÇIKLAMA --- */}
                        <div className="space-y-6">
                            <h2 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 uppercase tracking-wider">IV. Ekstra Bilgiler</h2>
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kongre Hakkında Genel Açıklama</label>
                                <textarea 
                                    rows="4"
                                    name="description"
                                    className="border border-slate-200 p-2.5 rounded-sm focus:border-slate-900 outline-none transition-all text-sm resize-none"
                                    value={formData.description}
                                    onChange={handleChange}
                                ></textarea>
                            </div>
                        </div>

                        {/* --- Butonlar --- */}
                        <div className="pt-6 border-t border-slate-100 flex justify-end gap-4">
                            <button 
                                type="button"
                                onClick={() => navigate(`/dashboard/congresses/${id}`)}
                                className="text-[11px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest px-6"
                            >
                                İptal
                            </button>
                            <button 
                                type="submit"
                                disabled={updateMutation.isPending}
                                className="bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold py-3.5 px-10 rounded-sm shadow-sm transition-all uppercase tracking-widest disabled:opacity-50"
                            >
                                {updateMutation.isPending ? 'Güncelleniyor...' : 'Verileri Kaydet'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default EditCongressPage;