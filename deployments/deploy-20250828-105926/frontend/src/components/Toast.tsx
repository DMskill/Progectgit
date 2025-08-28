"use client";

import { useEffect, useState } from 'react';

export type ToastType = 'info' | 'success' | 'error';
export type ToastItem = { id: number; message: string; type: ToastType };

let counter = 1;

export function toast(message: string, type: ToastType = 'info') {
    try { window.dispatchEvent(new CustomEvent('app-toast', { detail: { id: counter++, message, type } })); } catch { }
}

export function ToastHost() {
    const [items, setItems] = useState<ToastItem[]>([]);
    useEffect(() => {
        const onEvent = (e: Event) => {
            const detail = (e as CustomEvent).detail as ToastItem;
            setItems((prev) => [...prev, detail]);
            setTimeout(() => setItems((prev) => prev.filter((i) => i.id !== detail.id)), 2500);
        };
        window.addEventListener('app-toast', onEvent as EventListener);
        return () => window.removeEventListener('app-toast', onEvent as EventListener);
    }, []);
    return (
        <div className="fixed bottom-4 right-4 z-[1000] flex flex-col gap-2">
            {items.map((i) => (
                <div key={i.id} className={`px-3 py-2 rounded shadow text-sm text-white ${i.type === 'success' ? 'bg-emerald-600' : i.type === 'error' ? 'bg-rose-600' : 'bg-gray-800'} opacity-90`}>{i.message}</div>
            ))}
        </div>
    );
} 