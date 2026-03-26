// src/components/FloatingNotes.jsx
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNotes, useCreateNote, useUpdateNote, useDeleteNote } from '../hooks/useNotes';
import { Button, Card, CardHeader, CardContent, Textarea } from './ui';
import { format } from 'date-fns';
import { useStore } from '../store/useStore';

const StickyNoteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
);

export default function FloatingNotes() {
    const [mounted, setMounted] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [currentContent, setCurrentContent] = useState('');
    const [editingId, setEditingId] = useState(null);

    const user = useStore(s => s.user);
    const { data: notes = [], isLoading } = useNotes();
    const createNote = useCreateNote();
    const updateNote = useUpdateNote();
    const deleteNote = useDeleteNote();

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSave = async () => {
        if (!currentContent.trim() || !user) return;

        if (editingId) {
            await updateNote.mutateAsync({ id: editingId, content: currentContent });
            setEditingId(null);
        } else {
            // Pass only the content, as the hook now handles the user ID
            await createNote.mutateAsync(currentContent);
        }
        setCurrentContent('');
    };

    const handleEdit = (note) => {
        setEditingId(note.id);
        setCurrentContent(note.content);
        setIsOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this note?')) {
            await deleteNote.mutateAsync(id);
            if (editingId === id) {
                setEditingId(null);
                setCurrentContent('');
            }
        }
    };

    if (!mounted) return null;

    const floatingUI = (
        <div style={{
            position: 'fixed',
            bottom: '80px',
            right: '20px',
            zIndex: 999999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end'
        }}>
            {isOpen && (
                <Card className="w-80 md:w-96 mb-4 shadow-2xl border-0 flex flex-col h-[28rem] bg-white">
                    <CardHeader className="bg-yellow-100 py-3 flex justify-between items-center rounded-t-lg">
                        <h3 className="font-bold text-yellow-800 flex items-center gap-2">
                            <StickyNoteIcon /> Scratchpad
                        </h3>
                        <button onClick={() => setIsOpen(false)} className="text-yellow-700 hover:text-yellow-900 font-bold p-1">
                            ✕
                        </button>
                    </CardHeader>
                    <CardContent className="p-0 flex flex-col flex-1 overflow-hidden bg-yellow-50/30">
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {isLoading ? (
                                <p className="text-center text-sm text-gray-500">Loading notes...</p>
                            ) : notes.length === 0 ? (
                                <p className="text-center text-sm text-gray-500 mt-10">No notes yet. Add one below!</p>
                            ) : (
                                notes.map(note => (
                                    <div key={note.id} className="bg-white p-3 rounded shadow-sm text-sm group">
                                        <p className="whitespace-pre-wrap text-gray-800 mb-2">{note.content}</p>
                                        <div className="flex justify-between items-center mt-2 border-t pt-2">
                                            <span className="text-[10px] text-gray-400">
                                                {note.created_at ? format(new Date(note.created_at), 'MMM d, h:mm a') : 'Just now'}
                                            </span>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleEdit(note)} className="text-blue-500 hover:text-blue-700 text-xs font-semibold">Edit</button>
                                                <button onClick={() => handleDelete(note.id)} className="text-red-500 hover:text-red-700 text-xs font-semibold">Delete</button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-3 bg-white">
                            <Textarea
                                placeholder="Type a note..."
                                value={currentContent}
                                onChange={(e) => setCurrentContent(e.target.value)}
                                className="w-full text-sm mb-2 min-h-[60px] bg-yellow-50 focus:ring-yellow-400 focus:border-yellow-400"
                            />
                            <div className="flex gap-2 justify-end">
                                {editingId && (
                                    <Button variant="ghost" size="sm" onClick={() => { setEditingId(null); setCurrentContent(''); }} className="text-gray-500">Cancel</Button>
                                )}
                                <Button
                                    size="sm"
                                    onClick={handleSave}
                                    className="bg-yellow-400 hover:bg-yellow-500 text-yellow-900 border-none font-bold"
                                    disabled={!user}
                                >
                                    {editingId ? 'Update Note' : 'Add Note'}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    height: '56px', width: '56px',
                    backgroundColor: '#facc15',
                    color: '#713f12',
                    borderRadius: '9999px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '2px solid #fde047',
                    cursor: 'pointer'
                }}
                aria-label="Toggle Notes"
            >
                <StickyNoteIcon />
            </button>
        </div>
    );

    return createPortal(floatingUI, document.body);
}