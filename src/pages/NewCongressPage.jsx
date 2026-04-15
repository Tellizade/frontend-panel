// src/pages/NewCongressPage.jsx

import { useState } from 'react';
import apiClient from '../api/apiClient';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';

function NewCongressPage() {
    const navigate = useNavigate();
    
    // Form verileri (Veritabanı isimlendirme standartlarına uygun hale getirildi)
    const [formData, setFormData] = useState({
        name: '',
        topic: '',
        start_date: '',
        end_date: '',
        abstractDeadline: '',
        fee_presenter: '',
        fee_viewer: '',
        organizer: '',
        min_abstract_char: '100', 
        max_abstract_char: '2000' 
    });

    const [selectedFiles, setSelectedFiles] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        if (e.target.files) {
            setSelectedFiles(Array.from(e.target.files));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const data = new FormData();
        
        Object.keys(formData).forEach(key => {
            data.append(key, formData[key]);
        });
        
        selectedFiles.forEach(file => {
            data.append('images', file);
        });

        try {
            await apiClient.post('/congresses', data);
            toast.success('Akademik organizasyon başarıyla oluşturuldu.', {position: "bottom-center", theme: "dark"});
            navigate('/dashboard');
        } catch (error) {
            console.error(error);
            const errorMsg = error.response?.data?.error || 'Sistemsel bir hata oluştu.';
            toast.error(errorMsg, {position: "bottom-center"});
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] py-12 px-6 font-sans">
            <div className="max-w-3xl mx-auto">
                
                {/* Geri Dönüş Linki */}
                <div className="mb-6">
                    <Link to="/dashboard" className="text-xs font-bold text-slate-500 hover:text-slate-900 uppercase tracking-widest transition-colors flex items-center gap-2">
                        <span>&larr;</span> Ana Panele Dön
                    </Link>
                </div>

                <div className="bg-white border border-slate-200 shadow-sm rounded-sm overflow-hidden">
                    
                    {/* Form Başlığı */}
                    <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                        <h1 className="text-xl font-serif font-bold text-slate-900 italic">Yeni Organizasyon Kurulumu</h1>
                        <p className="text-[11px] text-slate-500 uppercase tracking-widest mt-1 font-bold">Kongre Teknik Bilgileri</p>
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
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ana Bilim Dalı / Tema</label>
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
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Başlangıç Tarihi</label>
                                    <input type="date" name="start_date" value={formData.start_date} onChange={handleChange} className="border border-slate-200 p-2.5 rounded-sm focus:border-slate-900 outline-none transition-all text-sm" required />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bitiş Tarihi</label>
                                    <input type="date" name="end_date" value={formData.end_date} onChange={handleChange} className="border border-slate-200 p-2.5 rounded-sm focus:border-slate-900 outline-none transition-all text-sm" required />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Özet Son Gönderim</label>
                                    <input type="date" name="abstractDeadline" value={formData.abstractDeadline} onChange={handleChange} className="border border-slate-200 p-2.5 rounded-sm focus:border-slate-900 outline-none transition-all text-sm bg-indigo-50/30" required />
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

                        {/* --- GÖRSELLER (Çoklu Logo) --- */}
                        <div className="space-y-6">
                            <h2 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 uppercase tracking-wider">IV. Görsel Materyaller</h2>
                            
                            <div className="border border-dashed border-slate-300 rounded-sm p-6 bg-slate-50 transition-colors hover:bg-slate-100 text-center">
                                <label className="cursor-pointer flex flex-col items-center">
                                    <svg className="w-8 h-8 text-slate-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                                    <span className="text-sm font-bold text-slate-700">Kongre Logolarını Yükle</span>
                                    <span className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest">Birden fazla seçim yapabilirsiniz</span>
                                    <input 
                                        type="file" 
                                        accept="image/*"
                                        multiple
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                </label>
                                
                                {selectedFiles.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-slate-200 text-left">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Seçili Dosyalar ({selectedFiles.length})</p>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedFiles.map((f, index) => (
                                                <span key={index} className="text-xs bg-white border border-slate-200 px-2 py-1 rounded-sm text-slate-600 shadow-sm truncate max-w-[150px]">
                                                    {f.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* --- SUBMIT --- */}
                        <div className="pt-6 border-t border-slate-100 flex justify-end">
                            <button 
                                type="submit" 
                                disabled={isSubmitting}
                                className="bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold py-3.5 px-10 rounded-sm shadow-sm transition-all uppercase tracking-widest disabled:opacity-50"
                            >
                                {isSubmitting ? 'Oluşturuluyor...' : 'Sisteme Kaydet'}
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
}

export default NewCongressPage;