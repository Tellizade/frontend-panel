// src/pages/CongressDetailPage.jsx

import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/apiClient';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2'; 

// --- API İSTEKLERİ ---
const fetchCongressById = async (congressId) => (await apiClient.get(`/congresses/${congressId}`)).data;
const fetchSubmissionsByCongressId = async (congressId) => (await apiClient.get(`/congresses/${congressId}/submissions`)).data;
const fetchSessionsByCongressId = async (congressId) => (await apiClient.get(`/congresses/${congressId}/sessions`)).data;
const fetchReviewersByCongressId = async (congressId) => {
    try {
        const res = await apiClient.get(`/congresses/${congressId}/reviewers`);
        return res.data;
    } catch (error) {
        return []; 
    }
};
const deleteSession = async (sessionId) => (await apiClient.delete(`/sessions/${sessionId}`)).data;

// --- YARDIMCI FONKSİYONLAR ---
const getStatusColor = (status) => {
    switch (status) {
        case 'Beklemede': return 'text-amber-700 bg-amber-50 border-amber-200'; 
        case 'Revizyon Edildi': return 'text-indigo-700 bg-indigo-50 border-indigo-200';
        case 'Kabul Edildi': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
        case 'Reddedildi': return 'text-rose-700 bg-rose-50 border-rose-200';
        case 'Hakem Değerlendirmesinde': return 'text-blue-700 bg-blue-50 border-blue-200';
        case 'Revizyon İstendi': return 'text-amber-700 bg-amber-50 border-amber-200';
        case 'Ödeme Onaylandı': return 'text-teal-700 bg-teal-50 border-teal-200';
        case 'Tam Metin Yüklendi': return 'text-purple-700 bg-purple-50 border-purple-200';
        case 'Sunum Yapıldı': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
        default: return 'text-slate-600 bg-slate-100 border-slate-300';
    }
};

const getStepLevel = (status) => {
    if (['Beklemede', 'Hakem Değerlendirmesinde', 'Revizyon İstendi', 'Revizyon Edildi'].includes(status)) return 1;
    if (['Kabul Edildi', 'Ödeme Onaylandı'].includes(status)) return 2;
    if (status === 'Tam Metin Yüklendi') return 3;
    if (status === 'Sunum Yapıldı') return 4;
    return 0; 
};

// --- ANA BİLEŞEN ---
function CongressDetailPage() {
    const { congressId } = useParams();
    const queryClient = useQueryClient();
    
    // ANA SAYFA SEKMELERİ
    const [mainPageTab, setMainPageTab] = useState('operasyon'); // 'operasyon' veya 'kurullar'

    // BİLDİRİ OPERASYON STATELERİ
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('Yeni Başvurular'); 
    const [draggedSubId, setDraggedSubId] = useState(null);

    // HAKEM & KURUL YÖNETİMİ STATELERİ
    const [newCommitteeName, setNewCommitteeName] = useState(''); 
    const [committees, setCommittees] = useState(['Bilim Kurulu', 'Düzenleme Kurulu']); 
    const [newReviewer, setNewReviewer] = useState({ 
        email: '', 
        committee_type: 'Bilim Kurulu', 
        expertise_topic: '' 
    });

    // VERİ ÇEKME (QUERIES)
    const { data: congress, isLoading: isLoadingCongress, error: congressError } = useQuery({ queryKey: ['congress', congressId], queryFn: () => fetchCongressById(congressId) });
    const { data: submissions, isLoading: isLoadingSubmissions } = useQuery({ queryKey: ['submissions', congressId], queryFn: () => fetchSubmissionsByCongressId(congressId) });
    const { data: sessions, isLoading: isLoadingSessions } = useQuery({ queryKey: ['sessions', congressId], queryFn: () => fetchSessionsByCongressId(congressId) });
    const { data: reviewers, isLoading: isLoadingReviewers } = useQuery({ queryKey: ['reviewers', congressId], queryFn: () => fetchReviewersByCongressId(congressId) });

    // ==========================================
    // 1. BÖLÜM: BİLDİRİ VE OTURUM İŞLEMLERİ
    // ==========================================
    const deleteSessionMutation = useMutation({
        mutationFn: deleteSession,
        onSuccess: () => { toast.success('Oturum silindi.', {position: "bottom-center"}); queryClient.invalidateQueries({ queryKey: ['sessions', congressId] }); }
    });

    const handleDeleteSession = (sessionId, sessionTitle) => {
        Swal.fire({
            title: 'Emin misiniz?',
            text: `"${sessionTitle}" oturumunu silmek istediğinize emin misiniz? Atanmış bildiriler boşa düşecektir.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Evet, Sil',
            cancelButtonText: 'İptal'
        }).then((result) => {
            if (result.isConfirmed) deleteSessionMutation.mutate(sessionId);
        });
    };

    const assignSessionMutation = useMutation({
        mutationFn: async ({ subId, sessionId }) => await apiClient.post(`/submissions/${subId}/assign-session`, { session_id: sessionId }),
        onSuccess: () => { toast.success('Atama başarılı.', {position: "bottom-center", theme: "dark"}); queryClient.invalidateQueries({ queryKey: ['submissions', congressId] }); },
        onError: () => toast.error("Atama başarısız oldu.", {position: "bottom-center"})
    });

    const unassignSessionMutation = useMutation({
        mutationFn: async (subId) => await apiClient.post(`/submissions/${subId}/unassign-session`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['submissions', congressId] }),
        onError: () => toast.error("Atama kaldırılamadı.", {position: "bottom-center"})
    });

    const createSessionMutation = useMutation({
        mutationFn: async (newSession) => (await apiClient.post(`/congresses/${congressId}/sessions`, newSession)).data,
        onSuccess: () => { toast.success('Oturum oluşturuldu.', {position: "bottom-center", theme: "dark"}); queryClient.invalidateQueries({ queryKey: ['sessions', congressId] }); },
        onError: (err) => toast.error(err.response?.data?.error || 'Hata oluştu.', {position: "bottom-center"})
    });

    const handleAddSession = async () => {
        const minDate = congress.start_date.split('T')[0];
        const maxDate = congress.end_date.split('T')[0];

        const { value: formValues } = await Swal.fire({
            title: 'Yeni Oturum Planla',
            html: `
                <div class="text-left text-sm mb-4 text-slate-500">
                    Kongre Tarihleri: <span class="font-bold text-slate-800">${new Date(congress.start_date).toLocaleDateString()} - ${new Date(congress.end_date).toLocaleDateString()}</span>
                </div>
                <div class="space-y-4">
                    <input id="session-title" class="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:border-slate-900" placeholder="Oturum Adı (Örn: Salon A)">
                    <input id="session-date" type="date" class="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:border-slate-900" min="${minDate}" max="${maxDate}">
                    <div class="flex gap-4">
                        <div class="flex-1">
                            <label class="block text-xs font-bold text-slate-500 mb-1 text-left">Başlangıç</label>
                            <input id="session-start" type="time" class="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:border-slate-900">
                        </div>
                        <div class="flex-1">
                            <label class="block text-xs font-bold text-slate-500 mb-1 text-left">Bitiş</label>
                            <input id="session-end" type="time" class="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:border-slate-900">
                        </div>
                    </div>
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonColor: '#0f172a',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Oluştur',
            cancelButtonText: 'İptal',
            customClass: { title: 'font-serif text-2xl text-slate-900' },
            preConfirm: () => {
                const title = document.getElementById('session-title').value;
                const date = document.getElementById('session-date').value;
                const start = document.getElementById('session-start').value;
                const end = document.getElementById('session-end').value;

                if (!title || !date || !start || !end) { Swal.showValidationMessage('Tüm alanlar zorunludur.'); return false; }
                if (end <= start) { Swal.showValidationMessage('Bitiş saati başlangıçtan sonra olmalıdır.'); return false; }

                return { title, session_date: date, start_time: start, end_time: end, location: 'Online' };
            }
        });

        if (formValues) createSessionMutation.mutate(formValues);
    };

    const handleToggleSession = async () => {
        const isCurrentlyActive = congress?.is_session_active;
        const actionText = isCurrentlyActive ? "durdurmak" : "başlatmak";
        Swal.fire({
            title: isCurrentlyActive ? "Kongreyi Durdur?" : "Kongreyi Başlat?",
            text: `Sistemi herkes için ${actionText} istediğinize emin misiniz?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#0f172a',
            cancelButtonColor: '#64748b',
            confirmButtonText: isCurrentlyActive ? "Oturumları Durdur" : "Kongreyi Başlat",
            cancelButtonText: 'İptal',
            customClass: { title: 'font-serif text-2xl text-slate-900' }
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await apiClient.patch(`/congresses/${congressId}/toggle-session`, { isActive: !isCurrentlyActive });
                    toast.success(!isCurrentlyActive ? "Kongre Oturumları Başlatıldı" : "Oturumlar Kapatıldı", {position: "bottom-center", theme: "dark"});
                    queryClient.invalidateQueries({ queryKey: ['congress', congressId] });
                } catch (error) { toast.error("İşlem başarısız oldu.", {position: "bottom-center"}); }
            }
        });
    };

    const handleToggleApproval = async (sub) => {
        const isCurrentlyApproved = sub.status === 'Sunum Yapıldı' || sub.presentation_approved;
        if (!isCurrentlyApproved) {
            const result = await Swal.fire({
                title: 'Sunum Onayı',
                html: `
                    <div class="text-left text-sm mt-2 text-slate-700 space-y-4">
                        <p>Yazar: <span class="font-bold text-slate-900">${sub.first_name} ${sub.last_name}</span></p>
                        <label class="flex items-center gap-3 cursor-pointer p-4 bg-slate-50 border border-slate-200 rounded">
                            <input type="checkbox" id="presented-checkbox" class="w-4 h-4 text-slate-900 border-slate-300 rounded focus:ring-slate-900">
                            <span class="font-medium text-slate-800">Sözlü sunumunu eksiksiz tamamlamıştır.</span>
                        </label>
                    </div>
                `,
                icon: 'info',
                showCancelButton: true,
                confirmButtonColor: '#0f172a', 
                cancelButtonColor: '#64748b', 
                confirmButtonText: 'Sunumu Onayla', 
                cancelButtonText: 'İptal',
                customClass: { title: 'font-serif text-2xl text-slate-900' },
                preConfirm: () => {
                    const isChecked = Swal.getPopup().querySelector('#presented-checkbox').checked;
                    if (!isChecked) Swal.showValidationMessage('Onay kutusunu işaretleyiniz.');
                    return isChecked;
                }
            });
            if (result.isConfirmed) executeApproval(sub.id, true);
        } else {
            const result = await Swal.fire({
                title: 'Onayı Geri Al',
                text: "Sunum onayı iptal edilecektir.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#ef4444', 
                cancelButtonColor: '#64748b', 
                confirmButtonText: 'Evet, Geri Al'
            });
            if (result.isConfirmed) executeApproval(sub.id, false);
        }
    };

    const executeApproval = async (id, willApprove) => {
        try {
            await apiClient.post(`/admin/approve-presentation/${id}`, { is_approved: willApprove });
            toast.success(willApprove ? 'Sunum başarıyla onaylandı.' : 'Sunum onayı geri alındı.', {position: "bottom-center"});
            queryClient.invalidateQueries({ queryKey: ['submissions', congressId] });
        } catch (error) { toast.error('İşlem başarısız oldu.', {position: "bottom-center"}); }
    };

    // ==========================================
    // 2. BÖLÜM: KURUL VE HAKEM İŞLEMLERİ
    // ==========================================
    const handleAddCommittee = (e) => {
        e.preventDefault();
        if (!newCommitteeName.trim()) return;
        if (committees.includes(newCommitteeName)) {
            toast.warning("Bu kurul zaten mevcut.", {position: "bottom-center"});
            return;
        }
        setCommittees([...committees, newCommitteeName]);
        setNewReviewer({ ...newReviewer, committee_type: newCommitteeName }); 
        setNewCommitteeName('');
    };

// 2. Kurul Silme (Onaylı ve Güvenli)
    const handleDeleteCommittee = (committeeToRemove) => {
        // Önce kurulda adam var mı kontrol et
        const isAssigned = reviewers?.some(r => r.committee_type === committeeToRemove);
        if (isAssigned) {
            toast.error("Bu kurulda aktif üyeler var. Önce üyeleri listeden çıkarın.", {position: "bottom-center"});
            return;
        }

        // Onay penceresi (SweetAlert)
        Swal.fire({
            title: 'Kurulu Sil?',
            text: `"${committeeToRemove}" kurulunu silmek istediğinize emin misiniz?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Evet, Sil',
            cancelButtonText: 'İptal'
        }).then((result) => {
            if (result.isConfirmed) {
                const updatedCommittees = committees.filter(c => c !== committeeToRemove);
                setCommittees(updatedCommittees);
                
                // Eğer silinen kurul, o an formda seçiliyse seçimi sıfırla
                if (newReviewer.committee_type === committeeToRemove) {
                    setNewReviewer({...newReviewer, committee_type: updatedCommittees[0] || ''});
                }
                
                toast.success("Kurul başarıyla silindi.", {position: "bottom-center", theme: "dark"});
            }
        });
    };

    const addReviewerMutation = useMutation({
        mutationFn: async (reviewerData) => await apiClient.post(`/congresses/${congressId}/reviewers`, reviewerData),
        onSuccess: () => {
            toast.success('Kullanıcı kurula eklendi.', {position: "bottom-center", theme: "dark"});
            setNewReviewer({ ...newReviewer, email: '', expertise_topic: '' });
            queryClient.invalidateQueries({ queryKey: ['reviewers', congressId] });
        },
        onError: (err) => toast.error(err.response?.data?.error || 'Eklenirken hata oluştu.', {position: "bottom-center"})
    });

    const handleAddReviewer = (e) => {
        e.preventDefault();
        if (!newReviewer.email || !newReviewer.committee_type) {
            toast.warning("E-Posta ve Kurul zorunludur.", {position: "bottom-center"});
            return;
        }
        addReviewerMutation.mutate(newReviewer);
    };

    const removeReviewerMutation = useMutation({
        mutationFn: async (reviewerId) => await apiClient.delete(`/congresses/${congressId}/reviewers/${reviewerId}`),
        onSuccess: () => {
            toast.success("Üye kuruldan çıkarıldı.", {position: "bottom-center", theme: "dark"});
            queryClient.invalidateQueries({ queryKey: ['reviewers', congressId] });
        },
        onError: (err) => toast.error(err.response?.data?.error || 'Silinirken hata oluştu.', {position: "bottom-center"})
    });

    const handleRemoveReviewer = (member) => {
        Swal.fire({
            title: 'Üyeyi Çıkar?',
            text: `${member.first_name || member.email} isimli üyeyi ${member.committee_type} kurulundan çıkarmak istediğinize emin misiniz?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Evet, Çıkar',
            cancelButtonText: 'İptal'
        }).then((result) => {
            if (result.isConfirmed) removeReviewerMutation.mutate(member.id);
        });
    };

    const updateReviewerMutation = useMutation({
        mutationFn: async ({ reviewerId, expertise_topic }) => await apiClient.patch(`/congresses/${congressId}/reviewers/${reviewerId}`, { expertise_topic }),
        onSuccess: () => {
            toast.success("Uzmanlık alanı güncellendi.", {position: "bottom-center"});
            queryClient.invalidateQueries({ queryKey: ['reviewers', congressId] });
        }
    });

    const handleEditExpertise = async (member) => {
        const { value: newTags } = await Swal.fire({
            title: 'Uzmanlık Alanlarını Düzenle',
            input: 'text',
            inputLabel: 'Virgülle ayırarak yazın (Örn: Yapay Zeka, Eğitim). Boş bırakabilirsiniz.',
            inputValue: member.expertise_topic || '',
            showCancelButton: true,
            confirmButtonText: 'Kaydet',
            cancelButtonText: 'İptal'
        });

        if (newTags !== undefined) {
            updateReviewerMutation.mutate({ reviewerId: member.id, expertise_topic: newTags });
        }
    };

    // --- HESAPLAMALAR VE FİLTRELEMELER ---
    const newSubmissionsCount = submissions?.filter(s => ['Beklemede', 'Revizyon Edildi'].includes(s.status)).length || 0;
    const filteredSubmissions = submissions?.filter(sub => {
        const query = searchTerm.toLowerCase();
        const fullName = `${sub.first_name} ${sub.last_name}`.toLowerCase();
        const matchesSearch = sub.title.toLowerCase().includes(query) || fullName.includes(query);

        let matchesTab = true;
        const isApp = sub.status === 'Sunum Yapıldı' || sub.presentation_approved;

        if (activeTab === 'Yeni Başvurular') matchesTab = ['Beklemede', 'Revizyon Edildi'].includes(sub.status);
        else if (activeTab === 'Atanmayanlar') matchesTab = !sub.session_id && ['Kabul Edildi', 'Ödeme Onaylandı', 'Tam Metin Yüklendi'].includes(sub.status) && !isApp;
        else if (activeTab === 'İncelemede') matchesTab = ['Hakem Değerlendirmesinde', 'Revizyon İstendi'].includes(sub.status);
        else if (activeTab === 'Ödeme & Dosya') matchesTab = ['Kabul Edildi', 'Ödeme Onaylandı'].includes(sub.status);
        else if (activeTab === 'Sunuma Hazır') matchesTab = sub.status === 'Tam Metin Yüklendi' && !isApp;
        else if (activeTab === 'Tamamlananlar') matchesTab = isApp;
        else if (activeTab === 'Tümü') matchesTab = true;

        return matchesSearch && matchesTab;
    }) || [];

    const groupedReviewers = reviewers?.reduce((acc, reviewer) => {
        const type = reviewer.committee_type || 'Diğer';
        if (!acc[type]) acc[type] = [];
        acc[type].push(reviewer);
        return acc;
    }, {}) || {};

    if (isLoadingCongress || isLoadingSubmissions || isLoadingSessions) return <div className="flex justify-center items-center h-screen bg-[#F8FAFC]"><span className="text-slate-500 font-medium">Veriler yükleniyor...</span></div>;
    if (congressError) return <div className="text-center p-12 text-rose-700 font-medium bg-[#F8FAFC]">Sistemsel bir hata oluştu.</div>;

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800 pb-12 selection:bg-indigo-100 selection:text-indigo-900">
            
            {/* STICKY HEADER */}
            <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
                <div className="container mx-auto px-6 py-4 max-w-screen-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">{congress.name}</h1>
                        <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-semibold">Yönetim Paneli</p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <Link to={`/dashboard/congresses/${congressId}/edit`} className="bg-white border border-slate-300 hover:bg-slate-50 hover:text-indigo-700 hover:border-indigo-300 text-slate-700 px-4 py-2 rounded text-xs font-bold transition-all shadow-sm flex items-center gap-2">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                            Ayarları Düzenle
                        </Link>
                        <Link to="/dashboard" className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded text-xs font-bold transition-colors shadow-sm">
                            &larr; Ana Panel
                        </Link>
                    </div>
                </div>

                {/* ANA SAYFA SEKMELERİ */}
                <div className="container mx-auto px-6 mt-4 max-w-screen-2xl flex gap-6 border-t border-slate-200 pt-3">
                    <button onClick={() => setMainPageTab('operasyon')} className={`pb-3 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${mainPageTab === 'operasyon' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                        Bildiri & Oturum Operasyonları
                    </button>
                    <button onClick={() => setMainPageTab('kurullar')} className={`pb-3 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${mainPageTab === 'kurullar' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                        Kurullar ve Hakem Havuzu
                    </button>
                </div>
            </header>
            
            <main className="container mx-auto px-6 mt-8 max-w-screen-2xl">

                {/* ========================================== */}
                {/* SEKME 1: BİLDİRİ VE OTURUM */}
                {/* ========================================== */}
                {mainPageTab === 'operasyon' && (
                    <>
                        {/* KONGRE BİLGİLERİ VE ANA ŞALTER KARTI */}
                        <section className="mb-8 bg-white border border-slate-200 rounded shadow-sm p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                            <div className="flex-1 grid grid-cols-2 lg:grid-cols-5 gap-6 divide-y md:divide-y-0 lg:divide-x divide-slate-100">
                                <div className="lg:px-4 first:pl-0">
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Konu / Tema</p>
                                    <p className="text-sm font-semibold text-slate-800 leading-snug">{congress.topic}</p>
                                </div>
                                <div className="lg:px-4">
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tarih Aralığı</p>
                                    <p className="text-sm font-semibold text-slate-800">
                                        {new Date(congress.start_date).toLocaleDateString()} - {new Date(congress.end_date).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="lg:px-4">
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Sunucu Ücreti</p>
                                    <p className="text-sm font-semibold text-slate-800">
                                        {congress.fee_presenter != null ? `${congress.fee_presenter} ₺` : 'Belirtilmedi'}
                                    </p>
                                </div>
                                <div className="lg:px-4">
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">İzleyici Ücreti</p>
                                    <p className="text-sm font-semibold text-slate-800">
                                        {congress.fee_viewer != null ? `${congress.fee_viewer} ₺` : 'Belirtilmedi'}
                                    </p>
                                </div>
                                <div className="lg:px-4">
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Organizatör</p>
                                    <p className="text-sm font-semibold text-slate-800">{congress.organizer || 'Merkez Yönetim'}</p>
                                </div>
                            </div>

                            <div className="w-full md:w-auto md:border-l border-slate-100 md:pl-6 shrink-0 mt-4 md:mt-0">
                                <button onClick={handleToggleSession} className={`w-full px-6 py-3 rounded text-sm font-bold border transition-colors flex items-center justify-center gap-2 shadow-sm ${congress?.is_session_active ? 'bg-white border-rose-200 text-rose-700 hover:bg-rose-50' : 'bg-slate-900 border-slate-900 text-white hover:bg-slate-800'}`}>
                                    {congress?.is_session_active ? "🔴 Kongreyi Durdur" : "🟢 Kongreyi Başlat"}
                                </button>
                            </div>
                        </section>

                        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                            {/* SOL TARAF: OTURUMLAR PANELİ */}
                            <aside className="xl:col-span-4 flex flex-col h-[75vh]">
                                <div className="bg-white rounded border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
                                    <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                                        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Oturum Programı</h2>
                                        <button onClick={handleAddSession} className="text-[11px] bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded hover:bg-slate-100 font-bold transition-colors shadow-sm">
                                            + Yeni Ekle
                                        </button>
                                    </div>
                                    
                                    <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-slate-200">
                                        {sessions.length === 0 ? (
                                            <p className="text-slate-400 text-xs text-center mt-10">Planlanmış oturum bulunmuyor.</p>
                                        ) : (
                                            sessions.map(session => {
                                                const assignedSubs = submissions?.filter(s => s.session_id === session.id) || [];
                                                return (
                                                    <div 
                                                        key={session.id} 
                                                        onDragOver={(e) => e.preventDefault()}
                                                        onDrop={(e) => {
                                                            e.preventDefault();
                                                            if (draggedSubId) {
                                                                assignSessionMutation.mutate({ subId: draggedSubId, sessionId: session.id });
                                                                setDraggedSubId(null);
                                                            }
                                                        }}
                                                        className={`p-4 bg-white rounded border transition-all duration-200 ${draggedSubId ? 'border-indigo-400 bg-indigo-50/50 scale-[1.01]' : 'border-slate-200 hover:border-slate-300'}`}
                                                    >
                                                        <div className="flex justify-between items-start mb-3">
                                                            <div>
                                                                <h4 className="font-bold text-slate-900 text-sm leading-tight">{session.title}</h4>
                                                                <p className="text-[11px] text-slate-500 font-medium mt-1 tracking-wide">
                                                                    {new Date(session.session_date).toLocaleDateString()} &bull; {session.start_time} - {session.end_time}
                                                                </p>
                                                            </div>
                                                            <button onClick={() => handleDeleteSession(session.id, session.title)} className="text-slate-400 hover:text-rose-600 transition-colors" title="Sil">
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                            </button>
                                                        </div>
                                                        
                                                        {assignedSubs.length > 0 && (
                                                            <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
                                                                {assignedSubs.map(ss => (
                                                                    <div key={ss.id} className="bg-slate-50 border border-slate-200 rounded px-2.5 py-2 flex justify-between items-center group/item transition-colors hover:bg-white hover:border-slate-300">
                                                                        <span className="text-[11px] text-slate-700 font-medium truncate pr-2" title={ss.title}>
                                                                            {ss.first_name} {ss.last_name}
                                                                        </span>
                                                                        <button onClick={() => unassignSessionMutation.mutate(ss.id)} className="text-slate-400 hover:text-rose-600 opacity-0 group-hover/item:opacity-100 transition-opacity" title="Kaldır">✖</button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            </aside>

                            {/* SAĞ TARAF: DETAYLI BAŞVURU TAKİBİ */}
                            <section className="xl:col-span-8 flex flex-col h-[75vh]">
                                <div className="bg-white rounded border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
                                    <div className="px-5 py-4 border-b border-slate-200 bg-white">
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                                            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Başvuru Süreç Takibi</h2>
                                            <div className="relative w-full sm:w-72">
                                                <input 
                                                    type="text" 
                                                    placeholder="Yazar veya Bildiri ara..." 
                                                    className="w-full p-2 pl-9 border border-slate-300 rounded text-sm focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 bg-slate-50 transition-all" 
                                                    value={searchTerm} 
                                                    onChange={(e) => setSearchTerm(e.target.value)} 
                                                />
                                                <svg className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                                            </div>
                                        </div>

                                        <div className="flex space-x-4 overflow-x-auto pb-1 scrollbar-hide border-b border-slate-100">
                                            {['Yeni Başvurular', 'Atanmayanlar', 'İncelemede', 'Ödeme & Dosya', 'Sunuma Hazır', 'Tamamlananlar', 'Tümü'].map(tab => (
                                                <button
                                                    key={tab}
                                                    onClick={() => setActiveTab(tab)}
                                                    className={`relative whitespace-nowrap pb-2 text-xs font-bold transition-colors border-b-2
                                                        ${activeTab === tab ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                                                >
                                                    {tab}
                                                    {tab === 'Yeni Başvurular' && newSubmissionsCount > 0 && (
                                                        <span className="ml-1.5 px-1.5 py-0.5 rounded bg-slate-900 text-white text-[9px] leading-none">
                                                            {newSubmissionsCount}
                                                        </span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50 scrollbar-thin scrollbar-thumb-slate-200">
                                        {filteredSubmissions.length === 0 ? (
                                            <div className="text-center mt-16">
                                                <p className="text-slate-400 text-sm font-medium">{searchTerm ? "Eşleşen kayıt bulunamadı." : "Bu filtreye uygun başvuru yok."}</p>
                                            </div>
                                        ) : (
                                            filteredSubmissions.map(sub => {
                                                const isApproved = sub.status === 'Sunum Yapıldı' || sub.presentation_approved;
                                                const step = getStepLevel(sub.status);
                                                const isDraggable = !sub.session_id && ['Kabul Edildi', 'Ödeme Onaylandı', 'Tam Metin Yüklendi'].includes(sub.status) && !isApproved;
                                                
                                                return (
                                                    <div 
                                                        key={sub.id} 
                                                        draggable={isDraggable}
                                                        onDragStart={() => setDraggedSubId(sub.id)}
                                                        onDragEnd={() => setDraggedSubId(null)}
                                                        className={`p-5 rounded border bg-white transition-all
                                                            ${isApproved ? 'border-emerald-200' : 'border-slate-200'}
                                                            ${isDraggable ? 'cursor-grab active:cursor-grabbing hover:border-slate-400 shadow-sm' : ''}
                                                            ${draggedSubId === sub.id ? 'opacity-50 scale-[0.98]' : ''}
                                                        `}
                                                    >
                                                        <div className="flex flex-col md:flex-row justify-between gap-6">
                                                            <div className="flex-1 flex gap-4">
                                                                {isDraggable && (
                                                                    <div className="flex items-center text-slate-300 hover:text-slate-500 transition-colors pt-1">
                                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                                                                    </div>
                                                                )}
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                                                                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded tracking-wider">ID: #{sub.id}</span>
                                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border tracking-wider ${isApproved ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : getStatusColor(sub.status)}`}>
                                                                            {isApproved ? 'Sunum Onaylandı' : sub.status}
                                                                        </span>
                                                                        {sub.session_id ? (
                                                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded text-indigo-700 bg-indigo-50 border border-indigo-200">📅 Oturuma Atandı</span>
                                                                        ) : (
                                                                            isDraggable && <span className="text-[10px] font-bold px-2 py-0.5 rounded text-slate-600 bg-white border border-slate-300 border-dashed">Atama Bekliyor</span>
                                                                        )}
                                                                    </div>
                                                                    <Link to={`/dashboard/admin/submissions/${sub.id}`} className="font-semibold text-slate-900 hover:text-indigo-600 text-[15px] leading-snug block mb-1.5 transition-colors">
                                                                        {sub.title}
                                                                    </Link>
                                                                    <p className="text-xs text-slate-500 font-medium mb-4 flex items-center gap-1.5">
                                                                        <span>👤</span> {sub.first_name} {sub.last_name}
                                                                    </p>
                                                                    {!isApproved && !['Beklemede', 'Revizyon Edildi'].includes(sub.status) && (
                                                                        <div className="flex items-center gap-1 mt-2 max-w-[200px]">
                                                                            {[1, 2, 3, 4].map(level => (
                                                                                <div key={level} className={`h-1 flex-1 rounded-sm ${step >= level ? 'bg-slate-800' : 'bg-slate-200'}`}></div>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col justify-center min-w-[150px] border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                                                                {['Beklemede', 'Revizyon Edildi'].includes(sub.status) && (
                                                                    <Link 
                                                                        to={`/dashboard/submissions/${sub.id}`}
                                                                        className="w-full py-2 px-3 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold text-center transition-colors"
                                                                    >
                                                                        İncelemeyi Başlat
                                                                    </Link>
                                                                )}
                                                                {(sub.status === 'Tam Metin Yüklendi' || isApproved) && (
                                                                    <button
                                                                        onClick={() => handleToggleApproval(sub)}
                                                                        className={`w-full py-2 px-3 rounded border text-xs font-semibold transition-colors
                                                                            ${isApproved ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50' : 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700'}
                                                                        `}
                                                                    >
                                                                        {isApproved ? 'Sunum Onayını Geri Al' : 'Sunumu Onayla'}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            </section>
                        </div>
                    </>
                )}

                {/* ========================================== */}
                {/* SEKME 2: KURULLAR VE HAKEM YÖNETİMİ */}
                {/* ========================================== */}
                {mainPageTab === 'kurullar' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        
                        {/* SOL: FORMLAR */}
                        <div className="lg:col-span-4 space-y-6">
                            
                            {/* 1. YENİ KURUL OLUŞTURMA VE LİSTELEME */}
                            <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
                                <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                                    <div>
                                        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Kurul Yönetimi</h2>
                                        <p className="text-[11px] text-slate-500 mt-1">Kongrenize kurullar ekleyin veya silin.</p>
                                    </div>
                                </div>
                                <div className="p-5">
                                    <form onSubmit={handleAddCommittee} className="flex gap-2 mb-4">
                                        <input 
                                            type="text" 
                                            placeholder="Örn: Danışma Kurulu..."
                                            className="flex-1 border border-slate-200 p-2 rounded focus:border-slate-900 outline-none text-sm bg-slate-50"
                                            value={newCommitteeName}
                                            onChange={(e) => setNewCommitteeName(e.target.value)}
                                            required
                                        />
                                        <button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 rounded shadow-sm text-xs transition-colors">
                                            Ekle
                                        </button>
                                    </form>

                                    {/* SİLİNEBİLİR KURUL LİSTESİ */}
                                    <div className="pt-4 border-t border-slate-100">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Mevcut Kurullar</p>
                                        <div className="flex flex-wrap gap-2">
                                            {committees.map(c => (
                                                <span key={c} className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 text-[11px] font-bold px-2.5 py-1.5 rounded shadow-sm">
                                                    {c}
                                                    <button type="button" onClick={() => handleDeleteCommittee(c)} className="text-slate-400 hover:text-rose-600 transition-colors ml-1" title="Kurulu Sil">
                                                        ✖
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 2. HAKEM/ÜYE EKLEME KARTI */}
                            <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden sticky top-32">
                                <div className="p-5 border-b border-slate-100 bg-slate-50">
                                    <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Kurula Üye Ata</h2>
                                </div>
                                <form onSubmit={handleAddReviewer} className="p-5 space-y-5">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hangi Kurul?</label>
                                        <select 
                                            className="border border-slate-200 p-2.5 rounded focus:border-slate-900 outline-none text-sm bg-indigo-50/50 font-bold text-indigo-900 border-indigo-200"
                                            value={newReviewer.committee_type}
                                            onChange={(e) => setNewReviewer({...newReviewer, committee_type: e.target.value})}
                                        >
                                            {committees.map((committee, idx) => (
                                                <option key={idx} value={committee}>{committee}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kullanıcı E-Posta Adresi</label>
                                        <input 
                                            type="email" 
                                            className="border border-slate-200 p-2.5 rounded focus:border-slate-900 outline-none text-sm bg-slate-50"
                                            value={newReviewer.email}
                                            onChange={(e) => setNewReviewer({...newReviewer, email: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex justify-between">
                                            <span>Uzmanlık Alanları</span>
                                            <span className="text-slate-300 italic">(İsteğe Bağlı)</span>
                                        </label>
                                        <input 
                                            type="text" 
                                            placeholder="Yapay Zeka, Robotik (Virgülle ayırın)"
                                            className="border border-slate-200 p-2.5 rounded focus:border-slate-900 outline-none text-sm bg-slate-50"
                                            value={newReviewer.expertise_topic}
                                            onChange={(e) => setNewReviewer({...newReviewer, expertise_topic: e.target.value})}
                                        />
                                    </div>
                                    <button 
                                        type="submit" 
                                        disabled={addReviewerMutation.isPending}
                                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded shadow-sm text-xs uppercase tracking-widest transition-colors disabled:opacity-50"
                                    >
                                        {addReviewerMutation.isPending ? 'Atanıyor...' : 'Kurula Ata'}
                                    </button>
                                </form>
                            </div>
                        </div>

                        {/* SAĞ: KURULLARA GÖRE GRUPLANMIŞ LİSTE */}
                        <div className="lg:col-span-8">
                            <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden min-h-[60vh] flex flex-col">
                                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
                                    <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Organizasyon Şeması</h2>
                                    <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">Toplam Üye: {reviewers?.length || 0}</span>
                                </div>
                                
                                <div className="flex-1 bg-slate-50 p-6">
                                    {isLoadingReviewers ? (
                                        <p className="text-slate-400 text-sm text-center mt-10">Kurullar yükleniyor...</p>
                                    ) : Object.keys(groupedReviewers).length === 0 ? (
                                        <div className="text-center py-16 bg-white rounded border border-dashed border-slate-300">
                                            <div className="text-4xl mb-4 text-slate-300">🏛️</div>
                                            <h3 className="text-lg font-bold text-slate-700">Henüz Atama Yapılmadı</h3>
                                        </div>
                                    ) : (
                                        <div className="space-y-8">
                                            {Object.entries(groupedReviewers).map(([committeeName, members]) => (
                                                <div key={committeeName} className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
                                                    <div className="bg-indigo-50 border-b border-indigo-100 px-4 py-3 flex justify-between items-center">
                                                        <h3 className="font-bold text-indigo-900 text-sm">{committeeName}</h3>
                                                        <span className="text-[10px] font-bold bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded">{members.length} Üye</span>
                                                    </div>
                                                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {members.map(member => {
                                                            const tags = member.expertise_topic ? member.expertise_topic.split(',').map(t => t.trim()).filter(Boolean) : [];

                                                            return (
                                                                <div key={member.id} className="border border-slate-100 p-4 rounded flex items-start gap-3 hover:border-slate-300 transition-colors group relative bg-white">
                                                                    
                                                                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                                                        <button onClick={() => handleEditExpertise(member)} className="text-slate-400 hover:text-blue-600 transition-colors" title="Etiketleri Düzenle">✏️</button>
                                                                        <button onClick={() => handleRemoveReviewer(member)} className="text-slate-400 hover:text-rose-600 transition-colors" title="Kuruldan Çıkar">🗑️</button>
                                                                    </div>

                                                                    <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center text-slate-500 font-bold shrink-0">
                                                                        {member.first_name ? member.first_name[0] : member.email[0].toUpperCase()}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0 pr-10">
                                                                        <div className="flex justify-between items-start">
                                                                            <h4 className="font-bold text-slate-800 text-sm truncate">
                                                                                {member.first_name ? `${member.first_name} ${member.last_name}` : 'İsimsiz Kullanıcı'}
                                                                            </h4>
                                                                        </div>
                                                                        <p className="text-[10px] text-slate-400 font-mono truncate mt-0.5">{member.email}</p>
                                                                        
                                                                        <div className="mt-2 flex flex-wrap gap-1">
                                                                            {tags.length > 0 ? tags.map((tag, i) => (
                                                                                <span key={i} className="inline-block bg-slate-100 text-slate-600 text-[10px] font-semibold px-2 py-0.5 rounded">
                                                                                    🎯 {tag}
                                                                                </span>
                                                                            )) : (
                                                                                <span className="inline-block bg-slate-50 text-slate-400 text-[10px] font-semibold px-2 py-0.5 rounded border border-dashed border-slate-200">
                                                                                    Belirtilmedi
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
}

export default CongressDetailPage;