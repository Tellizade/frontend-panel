// src/pages/ProgramSchedulePage.jsx

import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/apiClient';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'react-toastify';
import { useMemo, useState } from 'react';

// --- YARDIMCI FONKSİYONLAR (SADECE BİR KEZ BURADA TANIMLANIYOR) ---
const fetchSessions = async (congressId) => {
    const response = await apiClient.get(`/congresses/${congressId}/sessions`);
    return response.data;
};

const fetchAcceptedSubmissions = async (congressId) => {
    const response = await apiClient.get(`/congresses/${congressId}/accepted-submissions`);
    return response.data;
};

const assignSubmissionToSession = async ({ submissionId, sessionId }) => {
    const response = await apiClient.post(`/submissions/${submissionId}/assign-session`, { session_id: sessionId });
    return response.data;
};

const unassignSubmission = async ({ submissionId }) => {
    const response = await apiClient.post(`/submissions/${submissionId}/unassign-session`);
    return response.data;
};
// --------------------------------------------------------------------


// --- SÜRÜKLE-BIRAK COMPONENT'LERİ ---
function DraggableSubmission({ submission, isDragging }) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: `submission-${submission.id}`,
        data: { submissionId: submission.id, type: 'submission', item: submission },
    });
    const style = {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.5 : 1,
    };
    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="p-3 bg-white rounded-md shadow cursor-grab active:shadow-lg active:cursor-grabbing transition-opacity">
            <p className="font-bold text-sm">{submission.title}</p>
        </div>
    );
}

function DroppableSession({ session, children }) {
    const { isOver, setNodeRef } = useDroppable({
        id: `session-${session.id}`,
        data: { sessionId: session.id, type: 'session' },
    });
    const borderClass = isOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white';
    return (
        <div ref={setNodeRef} className={`p-4 rounded-lg border-2 border-dashed transition-colors min-h-[150px] ${borderClass}`}>
            <p className="font-bold text-blue-800">{session.title}</p>
            <p className="text-sm text-gray-600">{new Date(session.session_date).toLocaleDateString()} | {session.start_time} - {session.end_time}</p>
            <div className="mt-2 space-y-2">
                {children}
            </div>
        </div>
    );
}
// ------------------------------------


function ProgramSchedulePage() {
    const { congressId } = useParams();
    const queryClient = useQueryClient();
    const [activeId, setActiveId] = useState(null);
    const [activeItem, setActiveItem] = useState(null);

    const { data: sessions, isLoading: isLoadingSessions } = useQuery({
        queryKey: ['sessions', congressId],
        queryFn: () => fetchSessions(congressId),
    });

    const { data: allAcceptedSubmissions, isLoading: isLoadingSubmissions } = useQuery({
        queryKey: ['acceptedSubmissions', congressId],
        queryFn: () => fetchAcceptedSubmissions(congressId),
    });

    const unassignedSubmissions = useMemo(() => {
        return allAcceptedSubmissions?.filter(sub => sub.session_id === null) || [];
    }, [allAcceptedSubmissions]);

    const assignMutation = useMutation({
        mutationFn: assignSubmissionToSession,
        onSuccess: () => {
            toast.success('Başvuru oturuma atandı!');
            queryClient.invalidateQueries({ queryKey: ['acceptedSubmissions', congressId] });
        },
        onError: () => {
            toast.error('Atama sırasında bir hata oluştu.');
        }
    });

    const unassignMutation = useMutation({
        mutationFn: unassignSubmission,
        onSuccess: () => {
            toast.info('Başvuru, atanmamışlar havuzuna geri taşındı.');
            queryClient.invalidateQueries({ queryKey: ['acceptedSubmissions', congressId] });
        },
        onError: () => {
            toast.error('Geri alma sırasında bir hata oluştu.');
        }
    });

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    function handleDragStart(event) {
        setActiveId(event.active.id);
        setActiveItem(event.active.data.current.item);
    }

    function handleDragEnd(event) {
        setActiveId(null);
        setActiveItem(null);
        const { over, active } = event;
        if (over && active && over.data.current.type === 'session' && active.data.current.type === 'submission') {
            const submissionId = active.data.current.submissionId;
            const sessionId = over.data.current.sessionId;
            assignMutation.mutate({ submissionId, sessionId });
        }
    }

    if (isLoadingSessions || isLoadingSubmissions) {
        return <div className="text-center p-8">Program verileri yükleniyor...</div>;
    }

    return (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="container mx-auto p-4 md:p-8">
                <h1 className="text-3xl font-bold mb-6">Program Yönetimi</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <div className="bg-gray-100 p-4 rounded-lg shadow-inner">
                        <h2 className="text-xl font-semibold mb-4 text-gray-700">Atanacak Başvurular ({unassignedSubmissions.length})</h2>
                        <div className="space-y-3">
                            {unassignedSubmissions.map(submission => (
                                <DraggableSubmission 
                                    key={submission.id} 
                                    submission={submission} 
                                    isDragging={activeId === `submission-${submission.id}`} 
                                />
                            ))}
                        </div>
                    </div>

                    <div className="lg:col-span-2 bg-gray-100 p-4 rounded-lg shadow-inner">
                        <h2 className="text-xl font-semibold mb-4 text-gray-700">Oturumlar</h2>
                        <div className="space-y-3">
                            {sessions?.map(session => {
                                const assignedSubs = allAcceptedSubmissions?.filter(sub => sub.session_id === session.id) || [];
                                return (
                                    <DroppableSession key={session.id} session={session}>
                                        {assignedSubs.map(sub => (
                                            <div key={sub.id} className="flex justify-between items-center p-2 mt-2 bg-green-100 rounded text-sm text-green-800 shadow-sm">
                                                <span>{sub.title}</span>
                                                <button 
                                                    onClick={() => unassignMutation.mutate({ submissionId: sub.id })}
                                                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 text-xs rounded"
                                                    title="Oturumdan Kaldır"
                                                    disabled={unassignMutation.isPending}
                                                >
                                                    X
                                                </button>
                                            </div>
                                        ))}
                                    </DroppableSession>
                                );
                            })}
                        </div>
                    </div>
                </div>
                 <Link to={`/dashboard/congresses/${congressId}`}>
                    <button className="mt-8 bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
                        Geri Dön
                    </button>
                </Link>
            </div>

            <DragOverlay>
                {activeId && activeItem ? (
                    <div className="p-3 bg-white rounded-md shadow-xl cursor-grabbing opacity-75">
                         <p className="font-bold text-sm">{activeItem.title}</p>
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}

export default ProgramSchedulePage;