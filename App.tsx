import React, { useState, useCallback, useEffect } from 'react';
import { Mode, CreateFunction, EditFunction, ImageData, HistoryItem } from './types';
import { CREATE_FUNCTIONS, EDIT_FUNCTIONS, COLOR_PALETTES } from './constants';
import { generateCreativeImage, editImageFromPrompt } from './services/geminiService';
import FunctionCard from './components/FunctionCard';
import UploadArea from './components/UploadArea';
import ColorPaletteSelector from './components/ColorPaletteSelector';

// --- History Service ---
const HISTORY_KEY = 'ai-image-studio-history';
const MAX_HISTORY_ITEMS = 20;

const getHistory = (): HistoryItem[] => {
  try {
    const historyJson = localStorage.getItem(HISTORY_KEY);
    return historyJson ? JSON.parse(historyJson) : [];
  } catch (error) {
    console.error("Error reading history from localStorage", error);
    return [];
  }
};

const saveHistory = (history: HistoryItem[]): void => {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error("Error saving history to localStorage", error);
  }
};

const addToHistory = (item: HistoryItem): HistoryItem[] => {
  const currentHistory = getHistory();
  const newHistory = [item, ...currentHistory].slice(0, MAX_HISTORY_ITEMS);
  saveHistory(newHistory);
  return newHistory;
};

const clearHistory = (): HistoryItem[] => {
  localStorage.removeItem(HISTORY_KEY);
  return [];
};


// --- History Components ---

interface HistoryItemCardProps {
  item: HistoryItem;
  onSelect: (item: HistoryItem) => void;
}

const HistoryItemCard: React.FC<HistoryItemCardProps> = ({ item, onSelect }) => {
  return (
    <div 
      className="history-item-card aspect-square rounded-lg overflow-hidden cursor-pointer relative group"
      onClick={() => onSelect(item)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect(item)}
      aria-label={`View history for prompt: ${item.prompt}`}
    >
      <img src={item.imageUrl} alt={item.prompt} className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105" />
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center p-2">
        <p className="text-white text-xs text-center line-clamp-3">{item.prompt}</p>
      </div>
    </div>
  );
};

interface HistoryPanelProps {
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onClear: () => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, onSelect, onClear }) => {
  if (history.length === 0) {
    return null;
  }

  return (
    <div className="history-panel mt-6">
      <div className="flex justify-between items-center mb-2">
        <h3 className="section-title text-sm font-semibold text-gray-300">📜 Histórico</h3>
        <button 
          onClick={onClear} 
          className="text-xs text-gray-400 hover:text-red-400 transition-colors"
          title="Limpar Histórico"
        >
          Limpar
        </button>
      </div>
      <div className="history-grid grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
        {history.map(item => (
          <HistoryItemCard key={item.id} item={item} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
};


const Spinner: React.FC = () => (
  <div className="spinner animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
);

const App: React.FC = () => {
    const [mode, setMode] = useState<Mode>(Mode.Create);
    const [activeCreateFunc, setActiveCreateFunc] = useState<CreateFunction>(CreateFunction.Free);
    const [activeEditFunc, setActiveEditFunc] = useState<EditFunction>(EditFunction.AddRemove);
    const [prompt, setPrompt] = useState<string>('');
    const [aspectRatio, setAspectRatio] = useState<string>('1:1');
    const [activePalette, setActivePalette] = useState<string>('none');
    const [image1, setImage1] = useState<ImageData | null>(null);
    const [image2, setImage2] = useState<ImageData | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [history, setHistory] = useState<HistoryItem[]>([]);

    useEffect(() => {
        setHistory(getHistory());
    }, []);

    const isGenerateButtonDisabled = () => {
        if (isLoading) return true;
        if (!prompt.trim()) return true;
        if (mode === Mode.Edit) {
            const requiresTwo = EDIT_FUNCTIONS.find(f => f.id === activeEditFunc)?.requiresTwo;
            if (requiresTwo) {
                return !image1 || !image2;
            }
            return !image1;
        }
        return false;
    };

    const handleGenerate = useCallback(async () => {
        if (isGenerateButtonDisabled()) return;
        setIsLoading(true);
        setError(null);
        setResultImage(null);

        try {
            let generatedImageUrl: string;
            if (mode === Mode.Create) {
                generatedImageUrl = await generateCreativeImage(prompt, activeCreateFunc, aspectRatio, activePalette);
            } else {
                const imagesToEdit: ImageData[] = [];
                if (image1) imagesToEdit.push(image1);
                const requiresTwo = EDIT_FUNCTIONS.find(f => f.id === activeEditFunc)?.requiresTwo;
                if (requiresTwo && image2) {
                    imagesToEdit.push(image2);
                }
                generatedImageUrl = await editImageFromPrompt(prompt, imagesToEdit, activePalette);
            }
            setResultImage(generatedImageUrl);

            const newHistoryItem: HistoryItem = {
                id: `history-${Date.now()}`,
                timestamp: Date.now(),
                imageUrl: generatedImageUrl,
                prompt,
                mode,
                paletteId: activePalette,
            };
            if (mode === Mode.Create) {
                newHistoryItem.createFunction = activeCreateFunc;
                newHistoryItem.aspectRatio = aspectRatio;
            } else {
                newHistoryItem.editFunction = activeEditFunc;
            }
            const updatedHistory = addToHistory(newHistoryItem);
            setHistory(updatedHistory);

        } catch (e: any) {
            setError(e.message || "Ocorreu um erro desconhecido.");
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, [prompt, mode, activeCreateFunc, activeEditFunc, image1, image2, aspectRatio, activePalette]);
    
    const downloadImage = () => {
        if (!resultImage) return;
        const link = document.createElement('a');
        link.href = resultImage;
        link.download = `ai-image-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const resetForNewCreation = () => {
        setResultImage(null);
        setError(null);
        setPrompt('');
        setImage1(null);
        setImage2(null);
        setMode(Mode.Create);
        setActiveCreateFunc(CreateFunction.Free);
        setAspectRatio('1:1');
        setActivePalette('none');
    };

    const handleHistorySelect = (item: HistoryItem) => {
        setResultImage(item.imageUrl);
        setPrompt(item.prompt);
        setMode(item.mode);
        setActivePalette(item.paletteId || 'none');
        
        if (item.mode === Mode.Create) {
            setActiveCreateFunc(item.createFunction || CreateFunction.Free);
            setAspectRatio(item.aspectRatio || '1:1');
        } else {
            setActiveEditFunc(item.editFunction || EditFunction.AddRemove);
        }
        setError(null);
        setImage1(null);
        setImage2(null);
    };

    const handleClearHistory = () => {
        setHistory(clearHistory());
    };

    const renderFunctionGrid = () => {
        if (mode === Mode.Create) {
            return (
                <div id="createFunctions" className="functions-section">
                    <div className="functions-grid grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {CREATE_FUNCTIONS.map((func) => (
                            <FunctionCard
                                key={func.id}
                                icon={func.icon}
                                name={func.name}
                                isActive={activeCreateFunc === func.id}
                                onClick={() => setActiveCreateFunc(func.id as CreateFunction)}
                            />
                        ))}
                    </div>
                </div>
            );
        } else {
            return (
                <div id="editFunctions" className="functions-section">
                    <div className="functions-grid grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {EDIT_FUNCTIONS.map((func) => (
                            <FunctionCard
                                key={func.id}
                                icon={func.icon}
                                name={func.name}
                                isActive={activeEditFunc === func.id}
                                onClick={() => setActiveEditFunc(func.id as EditFunction)}
                            />
                        ))}
                    </div>
                </div>
            );
        }
    };

    const renderUploadSections = () => {
        if (mode === Mode.Edit) {
            const requiresTwo = EDIT_FUNCTIONS.find(f => f.id === activeEditFunc)?.requiresTwo;
            if (requiresTwo) {
                 return (
                    <div id="twoImagesSection" className="functions-section mt-4 space-y-3">
                        <div className="section-title text-sm font-semibold text-gray-300">📸 Duas Imagens Necessárias</div>
                         <div className="grid grid-cols-2 gap-3 h-32">
                             <UploadArea id="imageUpload1" onImageUpload={setImage1} title="Primeira Imagem" />
                             <UploadArea id="imageUpload2" onImageUpload={setImage2} title="Segunda Imagem" />
                         </div>
                    </div>
                );
            }
            return (
                <div id="uploadArea" className="mt-4 h-40">
                    <UploadArea id="imageUpload" onImageUpload={setImage1} title="Imagem para Editar" className="h-full" />
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-gray-900 text-white min-h-screen font-sans">
            <div className="container mx-auto p-4 flex flex-col lg:flex-row gap-6">
                {/* Left Panel */}
                <div className="left-panel lg:w-1/3 bg-gray-800 p-6 rounded-2xl shadow-xl flex flex-col lg:max-h-[calc(100vh-2rem)]">
                    <div className="flex-1 overflow-y-auto -mr-4 pr-4">
                        <header>
                            <h1 className="panel-title text-3xl font-bold text-white">🎨 AI Image Studio</h1>
                            <p className="panel-subtitle text-gray-400 mt-1">Gerador profissional de imagens</p>
                        </header>
                        
                        <div className="prompt-section mt-6">
                            <div className="section-title text-sm font-semibold text-gray-300 mb-2">💭 Descreva sua ideia</div>
                            <textarea
                                id="prompt"
                                className="prompt-input w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 resize-none"
                                placeholder="Descreva a imagem que você deseja criar..."
                                rows={4}
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                            ></textarea>
                        </div>
                        
                        {mode === Mode.Create && (
                            <div className="aspect-ratio-section mt-4">
                                <div className="section-title text-sm font-semibold text-gray-300 mb-2">📐 Proporção da Imagem</div>
                                <div className="grid grid-cols-5 gap-2">
                                    {['1:1', '16:9', '9:16', '4:3', '3:4'].map((ratio) => (
                                    <button
                                        key={ratio}
                                        onClick={() => setAspectRatio(ratio)}
                                        className={`aspect-ratio-btn p-2 border rounded-md text-xs font-mono transition-colors duration-200 ${
                                        aspectRatio === ratio
                                            ? 'bg-indigo-600 border-indigo-500 text-white'
                                            : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                                        }`}
                                        title={`Proporção ${ratio}`}
                                    >
                                        {ratio}
                                    </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        <div className="color-palette-section mt-4">
                            <div className="section-title text-sm font-semibold text-gray-300 mb-2">🎨 Paleta de Cores</div>
                            <ColorPaletteSelector
                                palettes={COLOR_PALETTES}
                                activePalette={activePalette}
                                onSelect={setActivePalette}
                            />
                        </div>

                        <div className="mode-toggle mt-4 grid grid-cols-2 gap-2 bg-gray-700 p-1 rounded-lg">
                            <button
                                onClick={() => setMode(Mode.Create)}
                                className={`mode-btn py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200 ${mode === Mode.Create ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}
                            >
                                Criar
                            </button>
                            <button
                                onClick={() => setMode(Mode.Edit)}
                                className={`mode-btn py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200 ${mode === Mode.Edit ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}
                            >
                                Editar
                            </button>
                        </div>
                        
                        <div className="mt-4">
                            {renderFunctionGrid()}
                        </div>

                        <div className="dynamic-content">
                            {renderUploadSections()}
                        </div>
                    </div>
                    <div className="flex-shrink-0">
                        <div className="pt-6">
                            <button
                                id="generateBtn"
                                className="generate-btn w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-all duration-200 hover:bg-indigo-700 disabled:bg-gray-500 disabled:cursor-not-allowed"
                                onClick={handleGenerate}
                                disabled={isGenerateButtonDisabled()}
                            >
                                {isLoading ? <Spinner /> : <span className="btn-text">🚀 Gerar Imagem</span>}
                            </button>
                        </div>
                        <HistoryPanel
                            history={history}
                            onSelect={handleHistorySelect}
                            onClear={handleClearHistory}
                        />
                    </div>
                </div>

                {/* Right Panel */}
                <div className="right-panel lg:w-2/3 bg-gray-800 p-6 rounded-2xl shadow-xl flex items-center justify-center min-h-[50vh] lg:min-h-0">
                    {isLoading && (
                        <div id="loadingContainer" className="loading-container text-center text-gray-400">
                            <div className="loading-spinner w-16 h-16 border-4 border-dashed border-indigo-500 rounded-full animate-spin mx-auto"></div>
                            <div className="loading-text mt-4 text-lg">Gerando sua imagem...</div>
                        </div>
                    )}
                    
                    {!isLoading && !resultImage && (
                         <div id="resultPlaceholder" className="result-placeholder text-center text-gray-500">
                            <div className="result-placeholder-icon text-7xl">🎨</div>
                            <div className="mt-4 text-xl">Sua obra de arte aparecerá aqui</div>
                        </div>
                    )}
                    
                    {error && !isLoading && (
                        <div className="text-center text-red-400">
                            <div className="text-5xl">⚠️</div>
                            <h3 className="text-xl font-semibold mt-4">Erro na Geração</h3>
                            <p className="mt-2 text-red-500 bg-red-900/50 p-3 rounded-md">{error}</p>
                             <button onClick={resetForNewCreation} className="mt-4 bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700">Tentar Novamente</button>
                        </div>
                    )}

                    {resultImage && !isLoading && (
                        <div id="imageContainer" className="image-container w-full h-full flex flex-col items-center justify-center relative group">
                            <img id="generatedImage" src={resultImage} alt="Generated Art" className="generated-image max-w-full max-h-full object-contain rounded-lg shadow-2xl"/>
                            <div className="image-actions absolute bottom-4 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/50 p-2 rounded-lg backdrop-blur-sm">
                                <button onClick={resetForNewCreation} className="action-btn text-2xl p-2 rounded-full bg-white/20 hover:bg-white/30" title="Nova Imagem">✨</button>
                                <button onClick={downloadImage} className="action-btn text-2xl p-2 rounded-full bg-white/20 hover:bg-white/30" title="Download">💾</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default App;