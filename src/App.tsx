/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { useDropzone } from 'react-dropzone';
import { 
  Upload, 
  Sparkles, 
  Download, 
  RefreshCw, 
  Image as ImageIcon,
  Check,
  ChevronRight,
  Loader2,
  Gift
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

type Style = {
  id: string;
  name: string;
  description: string;
  prompt: string;
  color: string;
};

const STYLES: Style[] = [
  {
    id: 'classic',
    name: '经典红火',
    description: '红灯笼、爆竹，浓浓年味',
    prompt: 'Transform this avatar into a festive Chinese New Year style. Use a vibrant red background with traditional red lanterns and firecrackers. Add subtle festive lighting and warm tones.',
    color: 'bg-red-600'
  },
  {
    id: 'dragon',
    name: '金龙贺岁',
    description: '祥龙环绕，金光闪闪',
    prompt: 'Transform this avatar into a Chinese New Year style featuring a majestic golden dragon motif. Use gold and red accents, with dragon scales or a dragon silhouette in the background. High-end, prestigious feel.',
    color: 'bg-amber-500'
  },
  {
    id: 'ink',
    name: '国风水墨',
    description: '传统水墨意境，优雅大气',
    prompt: 'Transform this avatar into a traditional Chinese ink wash painting style but with festive red accents. Use brush stroke textures, plum blossoms, and elegant calligraphy elements. Artistic and cultural.',
    color: 'bg-stone-800'
  },
  {
    id: 'cute',
    name: '可爱萌系',
    description: 'Q版元素，活泼可爱',
    prompt: 'Transform this avatar into a cute, cartoonish Chinese New Year style. Add adorable zodiac animals, small lucky bags, and soft festive decorations. Playful and joyful.',
    color: 'bg-pink-500'
  }
];

export default function App() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<Style>(STYLES[0]);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setOriginalImage(reader.result as string);
        setResultImage(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [] },
    multiple: false
  } as any);

  const handleTransform = async () => {
    if (!originalImage) return;

    setIsGenerating(true);
    setError(null);

    try {
      const base64Data = originalImage.split(',')[1];
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: 'image/png',
              },
            },
            {
              text: `${selectedStyle.prompt} Keep the person's facial features recognizable. Ensure the final output is a high-quality square avatar. DO NOT include any watermarks, text, logos, signatures, or branding in the generated image.`,
            },
          ],
        },
      });

      let foundImage = false;
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          setResultImage(`data:image/png;base64,${part.inlineData.data}`);
          foundImage = true;
          confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#FF0000', '#FFD700', '#FFFFFF']
          });
          break;
        }
      }

      if (!foundImage) {
        throw new Error("未能生成图像，请重试。");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "生成过程中出现错误，请稍后再试。");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = () => {
    if (!resultImage) return;
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = `cny-avatar-${selectedStyle.id}.png`;
    link.click();
  };

  const reset = () => {
    setOriginalImage(null);
    setResultImage(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#FDF2F2] text-stone-900 font-sans selection:bg-red-200">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-10">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full border-[40px] border-red-600" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full border-[40px] border-red-600" />
      </div>

      <header className="relative pt-12 pb-8 px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-100 text-red-700 text-sm font-semibold mb-4 border border-red-200"
        >
          <Gift size={16} />
          <span>2026 蛇年大吉</span>
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-5xl md:text-6xl font-black tracking-tighter text-red-700 mb-2"
        >
          福气头像
        </motion.h1>
        <p className="text-stone-500 max-w-md mx-auto">
          AI 智能生成，一键开启您的新春红火头像
        </p>
      </header>

      <main className="max-w-6xl mx-auto px-6 pb-24 space-y-12">
        {/* Step 1: Style Selection */}
        <section className="bg-white rounded-3xl p-8 shadow-xl shadow-red-900/5 border border-red-50">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <span className="w-2 h-6 bg-red-600 rounded-full" />
            第一步：选择新春风格
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {STYLES.map((style) => (
              <button
                key={style.id}
                onClick={() => setSelectedStyle(style)}
                className={`
                  flex flex-col gap-3 p-5 rounded-2xl border-2 transition-all text-left
                  ${selectedStyle.id === style.id 
                    ? 'border-red-600 bg-red-50 ring-4 ring-red-100' 
                    : 'border-stone-100 hover:border-red-200 bg-stone-50'}
                `}
              >
                <div className={`w-10 h-10 rounded-xl ${style.color} flex items-center justify-center text-white shrink-0`}>
                  <Sparkles size={18} />
                </div>
                <div>
                  <p className="font-bold text-stone-800">{style.name}</p>
                  <p className="text-xs text-stone-500 mt-1">{style.description}</p>
                </div>
                {selectedStyle.id === style.id && (
                  <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-white">
                    <Check size={14} />
                  </div>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Step 2: Comparison Area (Side-by-Side) */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Original Image Card */}
          <div className="bg-white rounded-3xl p-6 shadow-xl shadow-red-900/5 border border-red-50 flex flex-col">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-stone-600">
              <ImageIcon size={18} />
              原图预览
            </h3>
            <div className="flex-1">
              {!originalImage ? (
                <div 
                  {...getRootProps()} 
                  className={`
                    aspect-square rounded-2xl border-2 border-dashed transition-all cursor-pointer
                    flex flex-col items-center justify-center gap-4 p-8 h-full
                    ${isDragActive ? 'border-red-500 bg-red-50' : 'border-stone-200 hover:border-red-300 hover:bg-stone-50'}
                  `}
                >
                  <input {...getInputProps()} />
                  <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                    <Upload size={32} />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-stone-700">点击或拖拽上传</p>
                    <p className="text-sm text-stone-400 mt-1">支持 JPG, PNG 格式</p>
                  </div>
                </div>
              ) : (
                <div className="relative aspect-square rounded-2xl overflow-hidden group bg-stone-100">
                  <img 
                    src={originalImage} 
                    alt="Original" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <button 
                      onClick={reset}
                      className="p-3 rounded-full bg-white text-stone-900 hover:scale-110 transition-transform flex items-center gap-2 font-bold px-5"
                    >
                      <RefreshCw size={18} />
                      重新上传
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Result Image Card */}
          <div className="bg-stone-900 rounded-3xl p-6 shadow-2xl flex flex-col relative overflow-hidden">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-stone-400">
              <Sparkles size={18} />
              生成结果
            </h3>
            <div className="flex-1 relative">
              <AnimatePresence mode="wait">
                {!resultImage ? (
                  <motion.div 
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full h-full aspect-square flex flex-col items-center justify-center text-stone-500 gap-4 bg-stone-800/50 rounded-2xl border border-stone-700 border-dashed"
                  >
                    <div className="w-16 h-16 rounded-full bg-stone-800 flex items-center justify-center">
                      <ImageIcon size={32} />
                    </div>
                    <div className="text-center">
                      <p className="font-medium">等待纳福生成</p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full h-full aspect-square relative group"
                  >
                    <img 
                      src={resultImage} 
                      alt="Result" 
                      className="w-full h-full object-cover rounded-2xl"
                    />
                    
                    <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-b-2xl">
                      <div className="flex items-center justify-between">
                        <div className="text-white">
                          <p className="font-bold">生成成功！</p>
                          <p className="text-xs text-white/60">{selectedStyle.name}</p>
                        </div>
                        <button 
                          onClick={downloadImage}
                          className="bg-red-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-red-700 transition-colors text-sm"
                        >
                          <Download size={16} />
                          下载
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {isGenerating && (
                <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center z-10 rounded-2xl">
                  <div className="text-center space-y-4">
                    <div className="relative">
                      <Loader2 className="w-12 h-12 text-red-500 animate-spin mx-auto" />
                      <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-amber-400" size={20} />
                    </div>
                    <p className="text-white font-bold animate-pulse text-sm tracking-widest">
                      正在为您添福...
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Action Button */}
        <div className="max-w-md mx-auto space-y-4">
          <button
            onClick={handleTransform}
            disabled={!originalImage || isGenerating}
            className={`
              w-full py-5 rounded-2xl font-black text-xl flex items-center justify-center gap-3 transition-all
              ${!originalImage || isGenerating
                ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                : 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-600/30 hover:-translate-y-1'}
            `}
          >
            {isGenerating ? (
              <>
                <Loader2 className="animate-spin" />
                <span>正在生成中...</span>
              </>
            ) : (
              <>
                <Sparkles />
                <span>立即生成福气头像</span>
              </>
            )}
          </button>
          
          {error && (
            <p className="text-red-600 text-sm text-center font-medium bg-red-50 p-3 rounded-xl border border-red-100">
              {error}
            </p>
          )}

          {resultImage && !isGenerating && (
            <button 
              onClick={downloadImage}
              className="w-full py-4 rounded-2xl font-bold text-stone-700 bg-white border-2 border-stone-100 flex items-center justify-center gap-2 hover:bg-stone-50 transition-all"
            >
              <Download size={20} />
              保存并分享头像
            </button>
          )}
        </div>
      </main>

      <footer className="max-w-5xl mx-auto px-6 py-12 border-t border-red-100 text-center text-stone-400 text-sm">
        <p>© 2026 福气头像 - 让 AI 为您的新春增添喜庆</p>
        <p className="mt-2">Powered by Gemini 2.5 Flash Image With Ken</p>
      </footer>
    </div>
  );
}
