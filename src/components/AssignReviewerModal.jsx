// src/components/AssignReviewerModal.jsx

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/apiClient';

// Hakemleri çeken fonksiyon
const fetchReviewers = async () => {
    const response = await apiClient.get('/reviewers');
    return response.data;
};

function AssignReviewerModal({ onClose, onAssignSuccess }) {
    const [selectedReviewers, setSelectedReviewers] = useState([]);

    // React Query ile hakem listesini çekiyoruz
    const { data: reviewers, isLoading, error } = useQuery({
        queryKey: ['reviewers'],
        queryFn: fetchReviewers
    });

    // Checkbox'a tıklandığında seçili hakem listesini günceller
    const handleSelect = (reviewerId) => {
        setSelectedReviewers(prev =>
            prev.includes(reviewerId)
                ? prev.filter(id => id !== reviewerId) // Varsa çıkar
                : [...prev, reviewerId] // Yoksa ekle
        );
    };

    const handleSubmit = () => {
        onAssignSuccess(selectedReviewers);
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <h2>Hakem Ata</h2>
                {isLoading && <p>Hakemler yükleniyor...</p>}
                {error && <p>Hakemler yüklenemedi.</p>}
                {reviewers && (
                    <div>
                        {reviewers.map(reviewer => (
                            <div key={reviewer.id}>
                                <input
                                    type="checkbox"
                                    id={`reviewer-${reviewer.id}`}
                                    checked={selectedReviewers.includes(reviewer.id)}
                                    onChange={() => handleSelect(reviewer.id)}
                                />
                                <label htmlFor={`reviewer-${reviewer.id}`}>
                                    {reviewer.first_name} {reviewer.last_name} ({reviewer.title})
                                </label>
                            </div>
                        ))}
                    </div>
                )}
                <div style={styles.buttons}>
                    <button onClick={handleSubmit} disabled={selectedReviewers.length === 0}>Ata</button>
                    <button onClick={onClose} style={{ marginLeft: '10px' }}>İptal</button>
                </div>
            </div>
        </div>
    );
}

// Basit stil tanımlamaları
const styles = {
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center' },
    modal: { backgroundColor: 'white', padding: '20px', borderRadius: '8px', minWidth: '300px' },
    buttons: { marginTop: '20px' }
};

export default AssignReviewerModal;