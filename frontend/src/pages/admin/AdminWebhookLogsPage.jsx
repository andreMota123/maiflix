import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';

const StatusBadge = ({ status }) => {
    const config = {
        processed: { text: 'Processado', color: 'bg-green-500/20 text-green-300' },
        failed: { text: 'Falhou', color: 'bg-red-500/20 text-red-300' },
        received: { text: 'Recebido', color: 'bg-blue-500/20 text-blue-300' },
    }[status] || { text: status, color: 'bg-gray-500/20 text-gray-300' };

    return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${config.color}`}>{config.text}</span>;
};

const PayloadModal = ({ payload, onClose }) => (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-gray-800 rounded-xl p-6 w-full max-w-2xl shadow-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-white mb-4">Payload do Webhook</h3>
            <pre className="bg-gray-900 text-white p-4 rounded-lg text-xs overflow-auto max-h-[60vh]">
                {JSON.stringify(payload, null, 2)}
            </pre>
            <div className="text-right mt-4">
                <button onClick={onClose} className="bg-pink-600 hover:bg-pink-700 px-4 py-2 rounded-lg font-semibold">Fechar</button>
            </div>
        </div>
    </div>
);


const AdminWebhookLogsPage = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedPayload, setSelectedPayload] = useState(null);

    const fetchLogs = useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/webhook-logs');
            setLogs(data);
        } catch (err) {
            setError(err.response?.data?.message || 'Falha ao carregar logs.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    if (loading) return <div className="p-6 text-center">Carregando logs...</div>;
    if (error) return <div className="p-6 text-center text-red-400">{error}</div>;

    return (
        <div className="p-4 sm:p-6 space-y-6">
            {selectedPayload && <PayloadModal payload={selectedPayload} onClose={() => setSelectedPayload(null)} />}
            <h2 className="text-2xl font-bold text-white">Logs de Eventos (Webhooks Kiwify)</h2>
            <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                <ul className="divide-y divide-gray-700">
                    {logs.length === 0 ? (
                        <li className="p-6 text-center text-gray-400">Nenhum evento registrado ainda.</li>
                    ) : logs.map(log => (
                        <li key={log._id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 sm:space-x-4">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-3">
                                    <StatusBadge status={log.status} />
                                    <div>
                                        <span className="font-semibold text-white truncate">{log.event}</span>
                                        {log.customerEmail && (
                                            <span className="ml-2 text-sm text-gray-400 truncate">{log.customerEmail}</span>
                                        )}
                                    </div>
                                </div>
                                <p className="text-sm text-gray-300 mt-1 truncate pl-1">{log.message}</p>
                            </div>
                            <div className="flex items-center space-x-4 self-end sm:self-center flex-shrink-0">
                                <span className="text-xs text-gray-400">{new Date(log.createdAt).toLocaleString('pt-BR')}</span>
                                <button onClick={() => setSelectedPayload(log.payload)} className="text-sm text-pink-500 hover:text-pink-400 font-semibold">Ver Dados</button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default AdminWebhookLogsPage;