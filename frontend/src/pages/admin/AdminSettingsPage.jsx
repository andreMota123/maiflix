
import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

const DEFAULT_COLORS = {
  'brand-bg': '#1a1a2e',
  'brand-surface': '#16213e',
  'brand-primary': '#e94560',
  'brand-secondary': '#0f3460',
  'brand-text': '#dcdcdc',
  'brand-text-light': '#a7a9be',
};

const COLOR_LABELS = {
  'brand-bg': 'Fundo Principal',
  'brand-surface': 'Superfície (Cards)',
  'brand-primary': 'Cor Primária (Destaques)',
  'brand-secondary': 'Cor Secundária (Controles)',
  'brand-text': 'Texto Principal',
  'brand-text-light': 'Texto Secundário',
};

const AdminSettingsPage = () => {
    const [settings, setSettings] = useState({ colors: DEFAULT_COLORS, whatsappLink: '' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // Local state for forms
    const [localColors, setLocalColors] = useState(DEFAULT_COLORS);
    const [whatsappLink, setWhatsappLink] = useState('');
    const [testingEmail, setTestingEmail] = useState(false);

    const fetchSettings = useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/settings');
            const fetchedSettings = {
                colors: data.colors || DEFAULT_COLORS,
                whatsappLink: data.whatsappLink || '',
            };
            setSettings(fetchedSettings);
            setLocalColors(fetchedSettings.colors);
            setWhatsappLink(fetchedSettings.whatsappLink);
        } catch (err) {
            setError('Falha ao carregar configurações.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const handleColorChange = (key, value) => {
        setLocalColors(prev => ({ ...prev, [key]: value }));
    };

    const handleSaveColors = async (e) => {
        e.preventDefault();
        try {
            await api.post('/settings', { key: 'colors', value: localColors });
            alert('Cores salvas com sucesso!');
        } catch (err) {
            alert('Falha ao salvar cores.');
        }
    };

    const handleResetColors = () => {
        if (window.confirm('Tem certeza que deseja restaurar as cores padrão?')) {
            setLocalColors(DEFAULT_COLORS);
        }
    };
    
    const handleSaveWhatsappLink = async (e) => {
        e.preventDefault();
        try {
            await api.post('/settings', { key: 'whatsappLink', value: whatsappLink });
            alert('Link do WhatsApp salvo com sucesso!');
        } catch (err) {
            alert('Falha ao salvar o link.');
        }
    };

    const handleTestEmail = async () => {
        setTestingEmail(true);
        try {
            const response = await api.get('/test-email');
            alert(response.data || 'E-mail enviado com sucesso! Verifique sua caixa de entrada.');
        } catch (err) {
            console.error(err);
            alert('Erro ao enviar e-mail de teste. Verifique os logs do servidor.');
        } finally {
            setTestingEmail(false);
        }
    };

    if (loading) return <div className="p-6 text-center">Carregando configurações...</div>;
    if (error) return <div className="p-6 text-center text-red-400">{error}</div>;

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <h2 className="text-2xl font-bold text-white">Configurações Gerais</h2>
            
            {/* Configuração de E-mail */}
            <div className="bg-gray-800 rounded-xl p-6 max-w-3xl">
                <h3 className="text-xl font-bold text-white mb-2">Teste de E-mail</h3>
                <p className="text-sm text-gray-400 mb-4">
                    Envie um e-mail de teste para o endereço configurado no sistema (EMAIL_USER) para verificar se as credenciais do Gmail estão funcionando.
                </p>
                <Button onClick={handleTestEmail} disabled={testingEmail} className="bg-blue-600 hover:bg-blue-700">
                    {testingEmail ? 'Enviando...' : 'Enviar E-mail de Teste'}
                </Button>
            </div>

            <div className="bg-gray-800 rounded-xl p-6 max-w-3xl">
                <h3 className="text-xl font-bold text-white mb-4">Paleta de Cores</h3>
                <form onSubmit={handleSaveColors} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                        {Object.entries(localColors).map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between">
                                <label htmlFor={`color-${key}`} className="text-gray-300">{COLOR_LABELS[key]}</label>
                                <input
                                    id={`color-${key}`}
                                    type="color"
                                    value={value}
                                    onChange={(e) => handleColorChange(key, e.target.value)}
                                    className="w-10 h-10 p-0 border-none rounded-md bg-transparent cursor-pointer"
                                />
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                        <Button type="button" variant="ghost" onClick={handleResetColors}>Restaurar Padrão</Button>
                        <Button type="submit">Salvar Cores</Button>
                    </div>
                </form>
            </div>

            <div className="bg-gray-800 rounded-xl p-6 max-w-3xl">
                <h3 className="text-xl font-bold text-white mb-4">Link do Suporte (WhatsApp)</h3>
                <form onSubmit={handleSaveWhatsappLink} className="flex items-end space-x-2">
                    <div className="flex-grow">
                        <Input
                            label="URL Completa"
                            id="whatsapp-link"
                            type="text"
                            value={whatsappLink}
                            onChange={(e) => setWhatsappLink(e.target.value)}
                            placeholder="https://wa.me/..."
                            required
                        />
                    </div>
                    <Button type="submit">Salvar Link</Button>
                </form>
            </div>

        </div>
    );
};

export default AdminSettingsPage;