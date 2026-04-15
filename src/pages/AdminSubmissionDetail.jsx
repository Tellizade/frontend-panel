// src/pages/AdminSubmissionDetail.jsx

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/apiClient';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

// API İSTEKLERİ
const fetchSubmissionDetail = async (id) => (await apiClient.get(`/submissions/${id}`)).data;

// YENİ: Sadece ilgili kongrenin hakemlerini çeken fonksiyon
const fetchCongressReviewers = async (congressId) => {
    const response = await apiClient.get(`/congresses/${congressId}/reviewers`);
    return response.data;
};

function AdminSubmissionDetail() {
    const { submissionId } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [selectedReviewers, setSelectedReviewers] = useState([]);

    // 1. Önce Başvuruyu Çek (İçinden congress_id'yi alacağız)
    const { data: sub, isLoading, error } = useQuery({
        queryKey: ['admin-submission', submissionId],
        queryFn: () => fetchSubmissionDetail(submissionId)
    });

    // 2. Başvuru yüklendikten sonra, o başvurunun KONGRESİNE ait hakemleri çek
    const { data: reviewers, isLoading: isLoadingReviewers } = useQuery({
        queryKey: ['reviewers', sub?.congress_id],
        queryFn: () => fetchCongressReviewers(sub.congress_id),
        enabled: !!sub?.congress_id // Bu sorgu sadece sub.congress_id var olduğunda çalışır
    });

    const decideMutation = useMutation({
        mutationFn: async ({ decision, feedback }) => await apiClient.post(`/submissions/${submissionId}/decision`, { decision, feedback }),
        onSuccess: () => {
            toast.success('Karar ve notunuz sisteme işlendi.', { position: "bottom-center", theme: "dark" });
            queryClient.invalidateQueries({ queryKey: ['admin-submission', submissionId] });
        },
        onError: () => toast.error('Karar kaydedilirken hata oluştu.', { position: "bottom-center" })
    });

    const assignMutation = useMutation({
        mutationFn: async (reviewerIds) => await apiClient.post(`/submissions/${submissionId}/assign`, { reviewerIds }),
        onSuccess: () => {
            toast.success('Hakemler atandı.', { position: "bottom-center", theme: "dark" });
            setSelectedReviewers([]);
            queryClient.invalidateQueries({ queryKey: ['admin-submission', submissionId] });
        },
        onError: () => toast.error('Hakem atanırken hata oluştu.', { position: "bottom-center" })
    });

    const handleAssignReviewers = () => {
        if (selectedReviewers.length === 0) return;
        assignMutation.mutate(selectedReviewers);
    };

    const handleDecision = async (decisionType) => {
        let title, confirmText, inputPlaceholder;

        if (decisionType === 'accepted') {
            title = 'Kabul Kararı'; confirmText = 'Kabul Et'; inputPlaceholder = 'Yazara iletilecek tebrik mesajı veya ek not (İsteğe bağlı)';
        } else if (decisionType === 'rejected') {
            title = 'Ret Kararı'; confirmText = 'Reddet'; inputPlaceholder = 'Reddetme sebebi (İsteğe bağlı)';
        } else if (decisionType === 're_review') {
            title = 'Yeniden İnceleme'; confirmText = 'Hakemlere Gönder'; inputPlaceholder = 'Hakemlere notunuz (İsteğe bağlı)';
        } else {
            title = 'Revizyon Talebi'; confirmText = 'Revizyon İste'; inputPlaceholder = 'Düzeltilmesi gereken noktaları belirtiniz... (Zorunlu)';
        }

        const { value: feedback, isConfirmed } = await Swal.fire({
            title: title,
            input: 'textarea',
            inputPlaceholder: inputPlaceholder,
            inputAttributes: { 'aria-label': inputPlaceholder },
            showCancelButton: true,
            confirmButtonColor: '#0f172a', 
            cancelButtonColor: '#64748b',
            confirmButtonText: confirmText,
            cancelButtonText: 'İptal',
            reverseButtons: true,
            customClass: {
                title: 'font-serif text-2xl text-slate-900',
                htmlContainer: 'text-slate-600',
                input: 'border-slate-300 focus:ring-slate-900 focus:border-slate-900'
            },
            inputValidator: (value) => {
                if (decisionType === 'revision' && !value.trim()) {
                    return 'Revizyon talep ederken bir açıklama yazmanız zorunludur.';
                }
            }
        });

        if (isConfirmed) decideMutation.mutate({ decision: decisionType, feedback });
    };

    if (isLoading) return <div className="flex justify-center items-center h-screen bg-slate-50"><span className="text-slate-500 font-medium tracking-wide">Yükleniyor...</span></div>;
    if (error || !sub) return <div className="text-center p-12 text-rose-700 font-medium bg-slate-50">Başvuru bulunamadı veya yetkiniz yok.</div>;

    const isActionable = ['Beklemede', 'Hakem Değerlendirmesinde', 'Revizyon İstendi', 'Revizyon Edildi'].includes(sub.status);

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800 pb-20 selection:bg-indigo-100 selection:text-indigo-900">
            
            {/* STICKY HEADER */}
            <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
                <div className="container mx-auto px-6 md:px-12 py-4 max-w-7xl flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button 
                            onClick={() => navigate(-1)} 
                            className="text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-2 text-sm font-medium"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                            Geri Dön
                        </button>
                        <div className="h-4 w-px bg-slate-300 hidden sm:block"></div>
                        <span className="hidden sm:block text-xs font-semibold text-slate-400 tracking-widest uppercase">
                            Başvuru #{sub.id}
                        </span>
                    </div>

                    <div>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-sm text-xs font-semibold tracking-wide border
                            ${sub.status === 'Kabul Edildi' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                              sub.status === 'Reddedildi' ? 'bg-rose-50 border-rose-200 text-rose-700' :
                              sub.status === 'Revizyon Edildi' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' :
                              sub.status === 'Revizyon İstendi' ? 'bg-amber-50 border-amber-200 text-amber-700' : 
                              'bg-slate-100 border-slate-300 text-slate-600'}`
                        }>
                            {sub.status}
                        </span>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 md:px-12 mt-12 max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
                
                {/* SOL: OKUMA VE İÇERİK ALANI */}
                <article className="lg:col-span-7 xl:col-span-8">
                    
                    <header className="mb-12 border-b border-slate-200 pb-8">
                        <p className="text-sm font-medium text-slate-500 mb-4">{sub.congress_name}</p>
                        <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-semibold text-slate-900 leading-tight mb-6">
                            {sub.title}
                        </h1>
                        
                        <div className="flex flex-wrap gap-2 mt-6">
                            {(() => {
                                if (!sub.keywords) return null;
                                let kwArray = Array.isArray(sub.keywords) ? sub.keywords : (typeof sub.keywords === 'string' ? sub.keywords.split(',') : []);
                                if (kwArray.length === 0) return null;

                                return kwArray.map((kw, idx) => (
                                    <span key={idx} className="bg-slate-100 text-slate-600 px-3 py-1 rounded-sm text-xs font-medium tracking-wide">
                                        {typeof kw === 'string' ? kw.trim() : kw}
                                    </span>
                                ));
                            })()}
                        </div>
                    </header>

                    {/* Özet Alanı */}
                    <section className="mb-16">
                        <h2 className="font-sans text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Özet (Abstract)</h2>
                        <div className="prose prose-slate max-w-prose">
                            {sub.abstract ? (
                                <p className="font-sans text-[17px] md:text-[18px] text-slate-700 leading-[1.8] tracking-normal text-justify">
                                    {sub.abstract}
                                </p>
                            ) : (
                                <p className="italic text-slate-500 bg-slate-50 p-6 border border-slate-200 text-sm">Yazar henüz özet metni girmemiş.</p>
                            )}
                        </div>
                    </section>

                    {/* Tam Metin PDF */}
                    {sub.full_text_path && (
                        <section className="bg-white border border-slate-200 p-6 rounded-sm shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-16">
                            <div>
                                <h3 className="font-semibold text-slate-900 text-sm">Araştırma Dosyası (Tam Metin)</h3>
                                <p className="text-xs text-slate-500 mt-1">Yazar tarafından sağlanan akademik belge.</p>
                            </div>
                            <a 
                                href={`http://localhost:3000/${sub.full_text_path}`} 
                                target="_blank" 
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 px-5 py-2 rounded-sm text-sm font-medium transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                PDF Görüntüle
                            </a>
                        </section>
                    )}

                    {/* Hakem Raporları */}
                    {sub.reviews && sub.reviews.length > 0 && (
                        <section className="border-t border-slate-200 pt-12">
                            <h2 className="font-serif text-xl font-medium text-slate-900 mb-6">Hakem Değerlendirme Raporları</h2>
                            <div className="space-y-4">
                                {sub.reviews.map((rev, index) => (
                                    <div key={index} className="bg-white border border-slate-200 p-6 rounded-sm shadow-sm">
                                        <div className="flex justify-between items-start border-b border-slate-100 pb-4 mb-4">
                                            <div>
                                                <h3 className="font-semibold text-slate-900 text-sm">Hakem #{index + 1}</h3>
                                                <p className="text-xs text-slate-500 mt-1">Durum: {rev.status}</p>
                                            </div>
                                            {rev.decision && (
                                                <span className={`px-3 py-1 rounded-sm text-xs font-semibold uppercase tracking-wider
                                                    ${rev.decision === 'Kabul' ? 'bg-emerald-100 text-emerald-800' : 
                                                      rev.decision === 'Ret' ? 'bg-rose-100 text-rose-800' : 
                                                      'bg-amber-100 text-amber-800'}`}
                                                >
                                                    {rev.decision}
                                                </span>
                                            )}
                                        </div>
                                        {rev.comments ? (
                                            <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 border border-slate-100 rounded-sm whitespace-pre-wrap">
                                                {rev.comments}
                                            </p>
                                        ) : (
                                            <p className="text-xs italic text-slate-400">Henüz değerlendirme raporu girilmemiş.</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </article>

                {/* SAĞ: YAZAR BİLGİSİ & YÖNETİM PANELİ */}
                <aside className="lg:col-span-5 xl:col-span-4 space-y-6">
                    
                    {/* Yazar Kartı */}
                    <div className="bg-white border border-slate-200 p-6 rounded-sm shadow-sm">
                        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">Sorumlu Yazar</h3>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-sm bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-lg border border-slate-200">
                                {sub.first_name.charAt(0)}{sub.last_name.charAt(0)}
                            </div>
                            <div>
                                <p className="font-semibold text-slate-900 leading-tight">{sub.first_name} {sub.last_name}</p>
                                <p className="text-xs text-slate-500 mt-1">{sub.institution || 'Kurum Belirtilmemiş'}</p>
                            </div>
                        </div>
                        <a href={`mailto:${sub.email}`} className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline transition-colors block border-t border-slate-100 pt-3">
                            {sub.email}
                        </a>
                    </div>

                    {/* Yönetici Notu (Eğer varsa) */}
                    {sub.admin_feedback && (
                        <div className="bg-amber-50 border border-amber-200 p-6 rounded-sm shadow-sm">
                            <h3 className="text-[11px] font-bold text-amber-700 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path></svg>
                                Editör Notunuz
                            </h3>
                            <p className="text-sm text-amber-900 leading-relaxed font-medium">
                                {sub.admin_feedback}
                            </p>
                        </div>
                    )}

                    {/* HAKEM ATAMA MODÜLÜ (GÜNCELLENDİ) */}
                    {isActionable && (
                        <div className="bg-white border border-slate-200 p-6 rounded-sm shadow-sm">
                            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">Hakem Görevlendirme</h3>
                            
                            {isLoadingReviewers ? (
                                <div className="text-xs text-slate-500 animate-pulse text-center py-4">Kurul üyeleri taranıyor...</div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="max-h-64 overflow-y-auto border border-slate-200 bg-slate-50 rounded-sm p-1 scrollbar-thin scrollbar-thumb-slate-300">
                                        {reviewers?.map(rev => {
                                            // Etiketleri görselleştirmek için ayırıyoruz
                                            const tags = rev.expertise_topic && rev.expertise_topic !== 'Belirtilmemiş' 
                                                ? rev.expertise_topic.split(',').map(t => t.trim()).filter(Boolean) 
                                                : [];

                                            return (
                                                <label key={rev.user_id} className="flex items-start gap-3 text-sm cursor-pointer p-3 hover:bg-white rounded-sm transition-colors border-b border-slate-100 last:border-0 group">
                                                    {/* DİKKAT: Veritabanına kayıt için rev.id değil, rev.user_id gönderilmeli */}
                                                    <input 
                                                        type="checkbox" 
                                                        className="mt-1 w-4 h-4 text-slate-900 border-slate-300 rounded focus:ring-slate-900"
                                                        value={rev.user_id}
                                                        checked={selectedReviewers.includes(rev.user_id)}
                                                        onChange={(e) => {
                                                            if(e.target.checked) setSelectedReviewers([...selectedReviewers, rev.user_id]);
                                                            else setSelectedReviewers(selectedReviewers.filter(id => id !== rev.user_id));
                                                        }}
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-start mb-1">
                                                            <p className="font-medium text-slate-800 leading-none truncate pr-2">
                                                                {rev.first_name} {rev.last_name}
                                                            </p>
                                                            <span className="text-[9px] font-bold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-200 whitespace-nowrap">
                                                                {rev.committee_type}
                                                            </span>
                                                        </div>
                                                        
                                                        {/* Uzmanlık Alanları (Etiketler) */}
                                                        <div className="flex flex-wrap gap-1 mt-1.5">
                                                            {tags.length > 0 ? tags.map((tag, i) => (
                                                                <span key={i} className="inline-block bg-slate-200/60 text-slate-600 text-[9px] font-semibold px-1.5 py-0.5 rounded">
                                                                    🎯 {tag}
                                                                </span>
                                                            )) : (
                                                                <span className="text-[10px] italic text-slate-400">Etiket yok</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </label>
                                            );
                                        })}
                                        {reviewers?.length === 0 && (
                                            <p className="text-xs text-slate-400 text-center p-6">Bu kongrenin kurulunda henüz kayıtlı hakem bulunmuyor. <br/><br/> Önce kongre detay sayfasından kurula üye eklemelisiniz.</p>
                                        )}
                                    </div>
                                    <button 
                                        onClick={handleAssignReviewers}
                                        disabled={selectedReviewers.length === 0 || assignMutation.isPending}
                                        className="w-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium py-2.5 rounded-sm transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
                                    >
                                        {assignMutation.isPending ? 'Atanıyor...' : `Seçili Hakemleri Ata (${selectedReviewers.length})`}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* NİHAİ KARAR İŞLEMLERİ (Sticky Alt Kısım) */}
                    <div className="sticky top-28 bg-white border border-slate-200 p-6 rounded-sm shadow-sm">
                        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">Editöryal Karar</h3>

                        {isActionable ? (
                            <div className="space-y-3">
                                {sub.status === 'Revizyon Edildi' && (
                                    <button onClick={() => handleDecision('re_review')} className="w-full bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-semibold py-3 rounded-sm text-sm transition-colors flex justify-center items-center gap-2">
                                        👨‍🏫 Yeniden İncelemeye Gönder
                                    </button>
                                )}
                                <button onClick={() => handleDecision('accepted')} className="w-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-semibold py-3 rounded-sm text-sm transition-colors flex justify-center items-center gap-2">
                                    ✅ Başvuruyu Kabul Et
                                </button>
                                <button onClick={() => handleDecision('revision')} className="w-full bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 font-semibold py-3 rounded-sm text-sm transition-colors flex justify-center items-center gap-2">
                                    🔄 Revizyon İste
                                </button>
                                <button onClick={() => handleDecision('rejected')} className="w-full bg-white hover:bg-rose-50 border border-rose-300 text-rose-700 font-semibold py-3 rounded-sm text-sm transition-colors flex justify-center items-center gap-2">
                                    ❌ Başvuruyu Reddet
                                </button>
                            </div>
                        ) : (
                            <div className="text-center p-4 bg-slate-50 border border-slate-200 rounded-sm text-sm font-medium text-slate-500">
                                Bu başvuru süreci tamamlanmıştır.
                            </div>
                        )}
                    </div>

                </aside>
            </main>
        </div>
    );
}

export default AdminSubmissionDetail;