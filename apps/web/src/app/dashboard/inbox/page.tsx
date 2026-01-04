'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store';
import { whatsappApi } from '@/lib/api';
import toast from 'react-hot-toast';
import {
    ChatBubbleLeftRightIcon,
    UserIcon,
    CheckCircleIcon,
    ClockIcon,
    PaperAirplaneIcon,
    ArchiveBoxIcon,
    ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';
import clsx from 'clsx';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Message {
    id: string;
    direction: 'INBOUND' | 'OUTBOUND';
    type: 'TEXT' | 'TEMPLATE' | 'IMAGE';
    body: string;
    createdAt: string;
    status: 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
}

interface Conversation {
    id: string;
    contactPhone: string;
    contactName: string | null;
    status: 'ACTIVE' | 'WAITING_HUMAN' | 'HUMAN_HANDLING' | 'CLOSED';
    needsHumanAttention: boolean;
    lastMessageAt: string;
    lastMessage?: Message;
    assignedTo?: {
        id: string;
        firstName: string;
        lastName: string;
    } | null;
}

export default function InboxPage() {
    const { user, clinic } = useAuthStore();
    const queryClient = useQueryClient();
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'human'>('human');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [newMessage, setNewMessage] = useState('');

    // Fetch conversations
    const { data: conversations, isLoading: isLoadingConversations } = useQuery({
        queryKey: ['inbox', filter],
        queryFn: () => whatsappApi.getInbox(filter === 'human' ? { needsHuman: true } : undefined),
        refetchInterval: 10000, // Poll every 10s
    });

    // Fetch selected conversation details
    const { data: activeConversation, isLoading: isLoadingMessages } = useQuery({
        queryKey: ['conversation', selectedId],
        queryFn: () => whatsappApi.getConversation(selectedId!),
        enabled: !!selectedId,
        refetchInterval: 5000, // Poll active chat faster
    });

    // Mutations
    const assignMutation = useMutation({
        mutationFn: whatsappApi.assignConversation,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inbox'] });
            queryClient.invalidateQueries({ queryKey: ['conversation', selectedId] });
            toast.success('Conversación asignada a ti');
        },
    });

    const replyMutation = useMutation({
        mutationFn: ({ id, msg }: { id: string; msg: string }) =>
            whatsappApi.replyToConversation(id, msg),
        onSuccess: () => {
            setNewMessage('');
            queryClient.invalidateQueries({ queryKey: ['conversation', selectedId] });
            // Scroll to bottom
            setTimeout(scrollToBottom, 100);
        },
    });

    const closeMutation = useMutation({
        mutationFn: whatsappApi.closeConversation,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inbox'] });
            setSelectedId(null);
            toast.success('Conversación cerrada');
        },
    });

    // Scroll to bottom effect
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [activeConversation?.messages]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedId) return;
        replyMutation.mutate({ id: selectedId, msg: newMessage });
    };

    // Derived state
    const sortedConversations = conversations?.sort((a: Conversation, b: Conversation) =>
        new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    ) || [];

    if (!user) return null;

    return (
        <div className="flex h-[calc(100vh-8rem)] bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-slate-700">
            {/* Sidebar - Conversation List */}
            <div className="w-80 border-r border-gray-200 dark:border-slate-700 flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
                    <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Mensajes</h2>
                    <div className="flex p-1 bg-gray-200 dark:bg-slate-700 rounded-lg">
                        <button
                            onClick={() => { setFilter('human'); setSelectedId(null); }}
                            className={clsx(
                                'flex-1 text-sm font-medium py-1.5 rounded-md transition-all',
                                filter === 'human'
                                    ? 'bg-white dark:bg-slate-600 text-primary-600 dark:text-white shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900'
                            )}
                        >
                            Pendientes
                        </button>
                        <button
                            onClick={() => { setFilter('all'); setSelectedId(null); }}
                            className={clsx(
                                'flex-1 text-sm font-medium py-1.5 rounded-md transition-all',
                                filter === 'all'
                                    ? 'bg-white dark:bg-slate-600 text-primary-600 dark:text-white shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900'
                            )}
                        >
                            Todos
                        </button>
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto">
                    {isLoadingConversations ? (
                        <div className="p-4 flex justify-center">
                            <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : sortedConversations.length === 0 ? (
                        <div className="p-8 text-center text-gray-400">
                            <ChatBubbleLeftRightIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No hay mensajes</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100 dark:divide-slate-700">
                            {sortedConversations.map((conv: Conversation) => (
                                <button
                                    key={conv.id}
                                    onClick={() => setSelectedId(conv.id)}
                                    className={clsx(
                                        'w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors relative',
                                        selectedId === conv.id && 'bg-blue-50 dark:bg-blue-900/10'
                                    )}
                                >
                                    {conv.needsHumanAttention && (
                                        <span className="absolute left-0 top-0 bottom-0 w-1 bg-red-500" />
                                    )}
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={clsx(
                                            "font-semibold truncate max-w-[140px]",
                                            conv.needsHumanAttention ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"
                                        )}>
                                            {conv.contactName || conv.contactPhone}
                                        </span>
                                        <span className="text-[10px] text-gray-400">
                                            {format(new Date(conv.lastMessageAt), 'HH:mm', { locale: es })}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 truncate mb-1.5 h-4">
                                        {conv.lastMessage?.body || 'Imagen/Audio'}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        {conv.needsHumanAttention && (
                                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] font-medium">
                                                <ExclamationCircleIcon className="w-3 h-3" />
                                                Atención
                                            </span>
                                        )}
                                        {conv.assignedTo && (
                                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-medium">
                                                <UserIcon className="w-3 h-3" />
                                                {conv.assignedTo.firstName}
                                            </span>
                                        )}
                                        {conv.status === 'CLOSED' && (
                                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 text-[10px] font-medium">
                                                Cerrado
                                            </span>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Main Area - Chat */}
            <div className="flex-1 flex flex-col bg-[#efeae2] dark:bg-[#0b141a]">
                {selectedId && activeConversation ? (
                    <>
                        {/* Chat Header */}
                        <div className="h-16 px-6 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between shadow-sm z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center">
                                    <UserIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white">
                                        {activeConversation.contactName || activeConversation.contactPhone}
                                    </h3>
                                    <p className="text-xs text-gray-500">
                                        {activeConversation.contactPhone}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {!activeConversation.assignedTo && activeConversation.status !== 'CLOSED' && (
                                    <button
                                        onClick={() => assignMutation.mutate(selectedId)}
                                        disabled={assignMutation.isPending}
                                        className="btn-secondary text-xs py-1.5 h-8"
                                    >
                                        Asignármelo
                                    </button>
                                )}
                                <button
                                    onClick={() => closeMutation.mutate(selectedId)}
                                    disabled={closeMutation.isPending}
                                    title="Cerrar conversación"
                                    className="p-2 text-gray-500 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                                >
                                    <ArchiveBoxIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 bg-[url('/whatsapp-bg.png')] bg-repeat">
                            {/* Alert if needs attention */}
                            {activeConversation.needsHumanAttention && (
                                <div className="flex justify-center mb-4">
                                    <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg text-sm shadow-sm flex items-center gap-2 max-w-md text-center">
                                        <ExclamationCircleIcon className="w-5 h-5" />
                                        El paciente solicitó hablar con un humano.
                                    </div>
                                </div>
                            )}

                            {activeConversation.messages?.map((msg: Message) => (
                                <div
                                    key={msg.id}
                                    className={clsx(
                                        "flex w-full",
                                        msg.direction === 'OUTBOUND' ? "justify-end" : "justify-start"
                                    )}
                                >
                                    <div className={clsx(
                                        "max-w-[70%] rounded-lg p-3 shadow-sm relative text-sm",
                                        msg.direction === 'OUTBOUND'
                                            ? "bg-[#d9fdd3] dark:bg-[#005c4b] text-gray-900 dark:text-gray-100 rounded-tr-none"
                                            : "bg-white dark:bg-[#202c33] text-gray-900 dark:text-gray-100 rounded-tl-none"
                                    )}>
                                        <p className="whitespace-pre-wrap">{msg.body}</p>
                                        <div className="flex items-center justify-end gap-1 mt-1">
                                            <span className="text-[10px] text-gray-500 dark:text-gray-400">
                                                {format(new Date(msg.createdAt), 'HH:mm')}
                                            </span>
                                            {msg.direction === 'OUTBOUND' && (
                                                <span className={clsx(
                                                    "w-3 h-3",
                                                    msg.status === 'READ' ? "text-blue-500" : "text-gray-400"
                                                )}>
                                                    ✓✓
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-gray-50 dark:bg-[#202c33] border-t border-gray-200 dark:border-slate-700">
                            {activeConversation.status === 'CLOSED' ? (
                                <div className="text-center">
                                    <p className="text-gray-500 text-sm mb-2">Esta conversación está cerrada</p>
                                    <button
                                        onClick={() => replyMutation.mutate({ id: selectedId, msg: 'Hola 👋' })}
                                        className="text-primary-600 hover:underline text-sm font-medium"
                                    >
                                        Reabrir conversación
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Escribe un mensaje"
                                        className="flex-1 rounded-lg border-gray-300 dark:border-slate-600 bg-white dark:bg-[#2a3942] text-gray-900 dark:text-white focus:ring-0 focus:border-gray-400 px-4 py-3"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newMessage.trim() || replyMutation.isPending}
                                        className="p-3 bg-[#00a884] hover:bg-[#008f6f] text-white rounded-full shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {replyMutation.isPending ? (
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <PaperAirplaneIcon className="w-5 h-5" />
                                        )}
                                    </button>
                                </form>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-60">
                        <div className="w-64 h-64 bg-gray-200 dark:bg-slate-700 rounded-full flex items-center justify-center mb-6">
                            <ChatBubbleLeftRightIcon className="w-32 h-32 text-gray-400" />
                        </div>
                        <h2 className="text-2xl font-light text-gray-600 dark:text-gray-300 mb-2">
                            Bandeja de Entrada de WhatsApp
                        </h2>
                        <p className="text-gray-500">
                            Selecciona una conversación para responder a tus pacientes.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
