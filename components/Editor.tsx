import React, { useState, useCallback, useMemo, useEffect } from 'react';
import type { ImageState } from '../App';
import { StepIndicator } from './StepIndicator';
import { resizeAndScaleImage, scaleAndCenterImage } from '../utils/imageUtils';
import { editImageWithGeminiFlash, analyzeImageWithGemini } from '../services/geminiService';
import { Loader } from './Loader';
import { ErrorMessage } from './ErrorMessage';

interface EditorProps {
  initialImage: ImageState;
}

const steps = [
  { id: 1, name: 'Размер и обрезка' },
  { id: 2, name: 'Фон' },
  { id: 3, name: 'Улучшения' },
  { id: 4, name: 'Инфографика' },
];

const aspectRatios = ["1:1", "4:3", "3:4", "3:2", "2:3", "16:9", "9:16"];
const availableFonts = ['Arial', 'Verdana', 'Georgia', 'Times New Roman', 'Courier New'];
const fontSizes = ['Маленький', 'Средний', 'Большой'];
const infographicPositions = ['Авто', 'Верх-лево', 'Верх-центр', 'Верх-право', 'Центр-лево', 'Центр-право', 'Низ-лево', 'Низ-центр', 'Низ-право'];
const infographicStyles = ['Минималистичный', 'Современный', 'Творческий', 'Стильный'];
const styleMapping: { [key: string]: string } = {
    'Минималистичный': 'minimalist',
    'Современный': 'modern',
    'Творческий': 'creative',
    'Стильный': 'stylish'
};


export const Editor: React.FC<EditorProps> = ({ initialImage }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [history, setHistory] = useState<string[]>([initialImage.base64]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const currentImage = useMemo(() => history[currentStep - 1], [history, currentStep]);
  const [previewImage, setPreviewImage] = useState<string>(currentImage);

  // Step 1 state
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<string | null>(null);
  const [resizeScale, setResizeScale] = useState(1);
  const [resizePanX, setResizePanX] = useState(0);
  const [resizePanY, setResizePanY] = useState(0);

  // Step 2 state
  const [bgPrompt, setBgPrompt] = useState('');
  const [cutoutImageSource, setCutoutImageSource] = useState<string | null>(null);
  const [productScale, setProductScale] = useState(1);
  const [backgroundIntegration, setBackgroundIntegration] = useState('flexible');

  
  // Step 3 state
  const [colorPrompt, setColorPrompt] = useState('');
  const [analysis, setAnalysis] = useState<string | null>(null);

  // Step 4 state
  const [info1, setInfo1] = useState('');
  const [info2, setInfo2] = useState('');
  const [info3, setInfo3] = useState('');
  const [info1Position, setInfo1Position] = useState('Авто');
  const [info2Position, setInfo2Position] = useState('Авто');
  const [info3Position, setInfo3Position] = useState('Авто');
  const [selectedFont, setSelectedFont] = useState(availableFonts[0]);
  const [fontSize, setFontSize] = useState('Средний');
  const [infographicStyle, setInfographicStyle] = useState(infographicStyles[0]);
  const [isInfographicApplied, setIsInfographicApplied] = useState(false);


  useEffect(() => {
    setPreviewImage(currentImage);
    // Reset step-specific state when navigating
    setSelectedAspectRatio(null);
    setResizeScale(1);
    setResizePanX(0);
    setResizePanY(0);
    setCutoutImageSource(null);
    setProductScale(1);
    setBgPrompt('');
    setBackgroundIntegration('flexible');
    setColorPrompt('');
    setAnalysis(null);
    setInfo1('');
    setInfo2('');
    setInfo3('');
    setInfo1Position('Авто');
    setInfo2Position('Авто');
    setInfo3Position('Авто');
    setSelectedFont(availableFonts[0]);
    setFontSize('Средний');
    setInfographicStyle(infographicStyles[0]);
    setIsInfographicApplied(false);

  }, [currentImage, currentStep]);

  // Real-time preview for Step 1
  useEffect(() => {
    if (currentStep === 1 && selectedAspectRatio) {
        const updatePreview = async () => {
            setStatusMessage('Обновление предпросмотра...');
            setIsLoading(true);
            setError(null);
            try {
                const resized = await resizeAndScaleImage(currentImage, selectedAspectRatio, resizeScale, resizePanX, resizePanY);
                setPreviewImage(resized);
            } catch (e) {
                console.error(e);
                setError('Не удалось изменить размер изображения.');
            } finally {
                setIsLoading(false);
            }
        };
        updatePreview();
    }
  }, [currentStep, selectedAspectRatio, resizeScale, resizePanX, resizePanY, currentImage]);


  const handleApplyAndNext = () => {
    if (currentStep >= steps.length) return;
    const newHistory = [...history.slice(0, currentStep), previewImage];
    setHistory(newHistory);
    setCurrentStep(currentStep + 1);
  };
  
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleDownload = (image: string, step: 'final' | 'intermediate') => {
    const link = document.createElement('a');
    link.href = image;
    link.download = `edited-image-${step}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleGeminiEdit = useCallback(async (prompt: string, statusMsg: string, sourceImage: string = previewImage) => {
    if (!prompt) return;
    setStatusMessage(statusMsg);
    setIsLoading(true);
    setError(null);
    try {
      const newImageBase64 = await editImageWithGeminiFlash(sourceImage, initialImage.file.type, prompt);
      setPreviewImage(newImageBase64);
      return newImageBase64;
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Во время AI-редактирования произошла ошибка. Пожалуйста, попробуйте снова.');
    } finally {
      setIsLoading(false);
    }
    return null;
  }, [previewImage, initialImage.file.type]);

  const handleAnalyze = async () => {
    setStatusMessage('Анализ изображения...');
    setIsLoading(true);
    setAnalysis(null);
    setError(null);
    try {
        const prompt = "You are an e-commerce photo expert. Analyze this product image and provide three concise, actionable tips to improve its quality for a marketplace listing. Focus on lighting, composition, and background. Format as a bulleted list.";
        const result = await analyzeImageWithGemini(previewImage, initialImage.file.type, prompt);
        setAnalysis(result);
    } catch (error: any) {
        console.error("Analysis failed", error);
        setError(error.message || "К сожалению, сейчас не удалось проанализировать изображение.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleRemoveBg = async () => {
    const prompt = "Remove the background of this product image, making it transparent. Keep the product and its shadow intact. The main subject should be perfectly centered in the frame.";
    const newImage = await handleGeminiEdit(prompt, 'Удаление фона...', currentImage);
    if (newImage) {
        setCutoutImageSource(newImage);
        setProductScale(1);
    }
  };

  const handleReplaceBg = async () => {
    if (!bgPrompt) return;

    let integrationInstruction = '';
    switch(backgroundIntegration) {
        case 'flexible':
            integrationInstruction = 'You are allowed to slightly scale or rotate the product to fit naturally into the new background.';
            break;
        case 'scale_only':
            integrationInstruction = 'You are allowed to scale the product, but you must not rotate or change its appearance.';
            break;
        case 'strict':
            integrationInstruction = 'You must not change the product\'s scale, rotation, or appearance at all. Place it exactly as it is.';
            break;
    }

    const sourceImageForEdit = cutoutImageSource ? previewImage : currentImage;
    const prompt = cutoutImageSource 
      ? `Take this product image which has a transparent background and place it on a new background described as: '${bgPrompt}'. ${integrationInstruction} Make it look natural and realistic, preserving the product's proportions.`
      : `Replace the background with: ${bgPrompt}. ${integrationInstruction} The product should look natural in the new environment. The main subject should be perfectly centered in the frame.`;

    const newImage = await handleGeminiEdit(prompt, 'Замена фона...', sourceImageForEdit);
    if(newImage){
        setCutoutImageSource(null);
    }
  };

  const handleScaleChange = useCallback(async (newScale: number) => {
    setProductScale(newScale);
    if (!cutoutImageSource) return;
    
    try {
      const scaledImage = await scaleAndCenterImage(cutoutImageSource, newScale);
      setPreviewImage(scaledImage);
    } catch (e) {
      console.error(e);
      setError("Ошибка при масштабировании.");
    }
  }, [cutoutImageSource]);

  const handleInfographic = async (regenerate = false) => {
    const features = [
        { text: info1, position: info1Position },
        { text: info2, position: info2Position },
        { text: info3, position: info3Position },
    ].filter(f => f.text.trim() !== '');

    if (features.length === 0) return;

    let featureInstructions = features.map((f, i) => 
        `Feature ${i + 1}: Text is "${f.text}". Desired location is ${f.position}.`
    ).join(' ');
    
    const styleInEnglish = styleMapping[infographicStyle];

    let prompt = `You are an expert graphic designer creating a compelling infographic for an e-commerce product in Russian. Your task is to overlay the following key features onto the image.
Do not just add plain text. Instead, create visually appealing graphic blocks that integrate seamlessly with the product's design. These blocks should contain the text and may include subtle design elements like icons, shapes, or stylized containers to enhance visualization.

Global Style Instructions:
- Overall Style: Apply a '${styleInEnglish}' aesthetic.
- Font: Use a clear, professional font similar to '${selectedFont}' that supports Cyrillic.
- Font Size: Use a '${fontSize.toLowerCase()}' size relative to the image.
- Text Clarity: The text must be perfectly clear, legible, and exactly match the original text provided.

Feature-specific Instructions:
${featureInstructions}
For any feature where the location is 'Авто', use your expert judgment to find the best placement that is balanced and does not obscure the product. Ensure the graphic elements complement the product, not distract from it.`;
    
    const statusMsg = regenerate ? 'Создание нового дизайна...' : 'Добавление инфографики...';
    if (regenerate) {
        prompt += " Generate a completely new and different visual style and layout than the previous one, while respecting all instructions.";
    }

    const result = await handleGeminiEdit(prompt, statusMsg);
    if (result) {
        setIsInfographicApplied(true);
    }
  };
  
  const renderStepControls = () => {
    switch (currentStep) {
      case 1:
        return (
            <div>
                <h3 className="font-bold text-lg mb-2">Соотношение сторон</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {aspectRatios.map(ar => (
                        <button
                            key={ar}
                            onClick={() => {
                                setSelectedAspectRatio(ar);
                                setResizeScale(1);
                                setResizePanX(0);
                                setResizePanY(0);
                            }}
                            className={`p-2 rounded transition-colors ${selectedAspectRatio === ar ? 'bg-indigo-600 text-white' : 'bg-gray-700 hover:bg-indigo-500'}`}
                        >
                            {ar}
                        </button>
                    ))}
                </div>

                {selectedAspectRatio && (
                    <div className="pt-4 mt-4 border-t border-gray-700 space-y-4">
                        <div>
                            <label htmlFor="resizeScale" className="block text-sm font-medium text-gray-300 mb-1">Масштаб</label>
                            <input
                                id="resizeScale"
                                type="range"
                                min="1"
                                max="2"
                                step="0.01"
                                value={resizeScale}
                                onChange={(e) => setResizeScale(parseFloat(e.target.value))}
                                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                            <div className="text-center text-sm text-gray-400 mt-1">{(resizeScale * 100).toFixed(0)}%</div>
                        </div>
                         <div>
                            <label htmlFor="resizePanX" className="block text-sm font-medium text-gray-300 mb-1">Смещение по горизонтали</label>
                            <input
                                id="resizePanX"
                                type="range"
                                min="-1"
                                max="1"
                                step="0.01"
                                value={resizePanX}
                                onChange={(e) => setResizePanX(parseFloat(e.target.value))}
                                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                        </div>
                        <div>
                            <label htmlFor="resizePanY" className="block text-sm font-medium text-gray-300 mb-1">Смещение по вертикали</label>
                            <input
                                id="resizePanY"
                                type="range"
                                min="-1"
                                max="1"
                                step="0.01"
                                value={resizePanY}
                                onChange={(e) => setResizePanY(parseFloat(e.target.value))}
                                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                        </div>
                    </div>
                )}
            </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <button onClick={handleRemoveBg} className="w-full p-2 bg-gray-700 rounded hover:bg-indigo-600 transition-colors">Удалить фон</button>
            {cutoutImageSource && (
                <div className="pt-4 mt-4 border-t border-gray-700">
                  <label htmlFor="scale" className="block text-sm font-medium text-gray-300 mb-1">Масштаб товара</label>
                  <input
                    id="scale"
                    type="range"
                    min="0.5"
                    max="1.5"
                    step="0.01"
                    value={productScale}
                    onChange={(e) => handleScaleChange(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="text-center text-sm text-gray-400 mt-1">{(productScale * 100).toFixed(0)}%</div>
                </div>
            )}
            <div className="pt-4 border-t border-gray-700 space-y-3">
              <h3 className="font-bold text-lg">Замена Фона</h3>
              <input type="text" value={bgPrompt} onChange={e => setBgPrompt(e.target.value)} placeholder="Опишите новый фон..." className="w-full p-2 rounded-md bg-gray-800 border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500"/>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Опции интеграции товара:</label>
                <div className="flex flex-col space-y-2">
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input type="radio" name="integration" value="flexible" checked={backgroundIntegration === 'flexible'} onChange={e => setBackgroundIntegration(e.target.value)} className="form-radio h-4 w-4 text-indigo-600 bg-gray-700 border-gray-600 focus:ring-indigo-500"/>
                        <span className="text-sm">Гибкая интеграция (масштаб и поворот)</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input type="radio" name="integration" value="scale_only" checked={backgroundIntegration === 'scale_only'} onChange={e => setBackgroundIntegration(e.target.value)} className="form-radio h-4 w-4 text-indigo-600 bg-gray-700 border-gray-600 focus:ring-indigo-500"/>
                        <span className="text-sm">Только масштаб</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input type="radio" name="integration" value="strict" checked={backgroundIntegration === 'strict'} onChange={e => setBackgroundIntegration(e.target.value)} className="form-radio h-4 w-4 text-indigo-600 bg-gray-700 border-gray-600 focus:ring-indigo-500"/>
                        <span className="text-sm">Строгое соответствие (без изменений)</span>
                    </label>
                </div>
              </div>
              <button onClick={handleReplaceBg} className="w-full mt-2 p-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-500" disabled={!bgPrompt}>Заменить фон</button>
            </div>
            <button onClick={() => handleDownload(previewImage, 'intermediate')} className="w-full p-2 bg-green-600 text-white rounded hover:bg-green-700">Сохранить промежуточный PNG</button>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
             <button onClick={() => handleGeminiEdit("Add a realistic, soft shadow underneath the product to make it look grounded. Do not change the product itself.", "Добавление тени...")} className="w-full p-2 bg-gray-700 rounded hover:bg-indigo-600 transition-colors">Добавить реалистичную тень</button>
             <button onClick={() => handleGeminiEdit("Perform automatic photo enhancements on this product image. Improve brightness, contrast, and color saturation to make it look more professional. Do not alter the shape or color of the product itself.", "Применение автоулучшения...")} className="w-full p-2 bg-gray-700 rounded hover:bg-indigo-600 transition-colors">Автоулучшение</button>
             <div>
              <input type="text" value={colorPrompt} onChange={e => setColorPrompt(e.target.value)} placeholder="например, ярко-красный" className="w-full p-2 rounded-md bg-gray-800 border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500"/>
              <button onClick={() => handleGeminiEdit(`Change the color of the main product in the image to ${colorPrompt}. Keep the lighting and texture realistic.`, 'Изменение цвета...')} className="w-full mt-2 p-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-500" disabled={!colorPrompt}>Изменить цвет</button>
            </div>
            <div className="pt-4 border-t border-gray-700">
                <button onClick={handleAnalyze} disabled={isLoading} className="w-full p-2 bg-gray-700 rounded hover:bg-indigo-600 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-wait">
                    Получить AI-рекомендации
                </button>
                {analysis && <div className="mt-2 p-3 bg-gray-800 rounded prose prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: analysis.replace(/\n/g, '<br />') }}></div>}
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
             <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Стиль графики</label>
                <div className="flex flex-wrap gap-2">
                    {infographicStyles.map(style => (
                        <button 
                            key={style} 
                            onClick={() => setInfographicStyle(style)}
                            className={`px-3 py-1 text-sm rounded-full transition-colors ${infographicStyle === style ? 'bg-indigo-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}
                        >
                            {style}
                        </button>
                    ))}
                </div>
             </div>
             
             <p className="text-sm text-gray-400">Добавьте до 3 ключевых характеристик. ИИ создаст для них стильные графические блоки.</p>
             
             <div className="space-y-3">
                <div className="space-y-1">
                    <label className="text-xs text-gray-400">Характеристика 1</label>
                    <div className="flex items-center space-x-2">
                        <input type="text" value={info1} onChange={e => setInfo1(e.target.value)} placeholder="Например, '100% хлопок'" className="flex-grow p-2 rounded-md bg-gray-800 border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 text-sm"/>
                        <select value={info1Position} onChange={e => setInfo1Position(e.target.value)} disabled={!info1} className="p-2 rounded-md bg-gray-700 border border-gray-600 text-sm disabled:opacity-50">
                            {infographicPositions.map(pos => <option key={`p1-${pos}`} value={pos}>{pos}</option>)}
                        </select>
                    </div>
                </div>
                 <div className="space-y-1">
                    <label className="text-xs text-gray-400">Характеристика 2</label>
                    <div className="flex items-center space-x-2">
                        <input type="text" value={info2} onChange={e => setInfo2(e.target.value)} placeholder="Например, 'Сделано в Италии'" className="flex-grow p-2 rounded-md bg-gray-800 border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 text-sm"/>
                        <select value={info2Position} onChange={e => setInfo2Position(e.target.value)} disabled={!info2} className="p-2 rounded-md bg-gray-700 border border-gray-600 text-sm disabled:opacity-50">
                             {infographicPositions.map(pos => <option key={`p2-${pos}`} value={pos}>{pos}</option>)}
                        </select>
                    </div>
                </div>
                 <div className="space-y-1">
                    <label className="text-xs text-gray-400">Характеристика 3</label>
                    <div className="flex items-center space-x-2">
                        <input type="text" value={info3} onChange={e => setInfo3(e.target.value)} placeholder="Например, 'Ручная работа'" className="flex-grow p-2 rounded-md bg-gray-800 border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 text-sm"/>
                        <select value={info3Position} onChange={e => setInfo3Position(e.target.value)} disabled={!info3} className="p-2 rounded-md bg-gray-700 border border-gray-600 text-sm disabled:opacity-50">
                             {infographicPositions.map(pos => <option key={`p3-${pos}`} value={pos}>{pos}</option>)}
                        </select>
                    </div>
                </div>
             </div>

             <div className="pt-2 space-y-3">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Общий стиль шрифта</label>
                     <div className="flex flex-wrap gap-2">
                        {availableFonts.map(font => (
                            <button 
                                key={font} 
                                onClick={() => setSelectedFont(font)}
                                className={`px-3 py-1 text-xs rounded-full transition-colors ${selectedFont === font ? 'bg-indigo-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}
                            >
                                {font}
                            </button>
                        ))}
                    </div>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Размер текста</label>
                    <div className="flex flex-wrap gap-2">
                        {fontSizes.map(size => (
                            <button 
                                key={size} 
                                onClick={() => setFontSize(size)}
                                className={`px-3 py-1 text-sm rounded-full transition-colors ${fontSize === size ? 'bg-indigo-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}
                            >
                                {size}
                            </button>
                        ))}
                    </div>
                </div>
             </div>

             <div className="pt-2 space-y-2">
                 <button onClick={() => handleInfographic(false)} className="w-full p-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-500" disabled={!info1 && !info2 && !info3}>
                    {isInfographicApplied ? 'Обновить инфографику' : 'Добавить инфографику'}
                 </button>
                 {isInfographicApplied && (
                     <button onClick={() => handleInfographic(true)} className="w-full p-2 bg-gray-600 text-white rounded hover:bg-gray-500">
                        Сгенерировать новый дизайн
                     </button>
                 )}
             </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto">
      <StepIndicator steps={steps} currentStep={currentStep} />
      <div className="mt-16 grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 relative aspect-square bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden">
            {isLoading && (
                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-10">
                    <Loader />
                    <p className="mt-4 text-lg">{statusMessage || 'Обработка...'}</p>
                </div>
            )}
            <img src={previewImage} alt="Product" className="max-h-full max-w-full object-contain" />
        </div>
        <div className="bg-gray-800/50 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">{steps.find(s => s.id === currentStep)?.name}</h2>
            {renderStepControls()}
            {error && <ErrorMessage message={error} />}
            <div className="mt-6 flex justify-between">
                <button onClick={handleBack} disabled={currentStep === 1} className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed">Назад</button>
                {currentStep < steps.length ? (
                    <button onClick={handleApplyAndNext} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Применить</button>
                ) : (
                    <button onClick={() => handleDownload(previewImage, 'final')} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Сохранить финальное изображение</button>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};