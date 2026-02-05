
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, BookOpen, User, Camera, Trash2, Check, Loader2, Sparkles, X, Info, Search, ShieldCheck, Target, Droplets, AlertTriangle, History, Share2, Clipboard, Heart, Star, Wand2 } from 'lucide-react';
import { storage } from './services/storageService';
import { geminiService } from './services/geminiService';
import { 
  Product, 
  IngredientCategory, 
  DeviceMode, 
  UsageLog, 
  RoutineStep,
  CycleDay,
  SkinGoal
} from './types';
import RoutineCard from './components/RoutineCard';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'routine' | 'shelf' | 'profile'>('routine');
  const [products, setProducts] = useState<Product[]>([]);
  const [history, setHistory] = useState<UsageLog[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [humidity] = useState(84); 
  const [useDevice, setUseDevice] = useState(true);
  const [selectedGoal, setSelectedGoal] = useState<SkinGoal>(SkinGoal.CLEAR_PORES);
  const [routine, setRoutine] = useState<RoutineStep[]>([]);
  const [justShared, setJustShared] = useState(false);

  const [manualProduct, setManualProduct] = useState({
    brand: '',
    name: '',
  });

  useEffect(() => {
    setProducts(storage.getShelf());
    setHistory(storage.getHistory());
  }, []);

  // --- SAFETY & HISTORY ENGINE ---
  const historyAnalysis = useMemo(() => {
    const now = new Date();
    const sortedHistory = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const last7Days = sortedHistory.filter(h => (now.getTime() - new Date(h.date).getTime()) < 7 * 24 * 60 * 60 * 1000);
    
    // Check specific "Yesterday" log for consecutive rule
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toISOString().split('T')[0];
    const usedExfoliantYesterday = last7Days.some(h => 
      h.date.startsWith(yesterdayString) && 
      (h.categoryUsed === IngredientCategory.ACID_EXFOLIANT || h.categoryUsed === IngredientCategory.CLAY_MASK)
    );

    // Air Shot Cooldown
    const lastAirShot = sortedHistory.find(h => h.deviceMode === DeviceMode.AIR_SHOT);
    let airShotCooldown = false;
    if (lastAirShot) {
      const daysSince = (now.getTime() - new Date(lastAirShot.date).getTime()) / (1000 * 3600 * 24);
      if (daysSince < 3) airShotCooldown = true;
    }

    return { last7Days, usedExfoliantYesterday, airShotCooldown };
  }, [history]);

  const currentCycle = useMemo(() => {
    // 1. Force Recovery if Exfoliant was used yesterday
    if (historyAnalysis.usedExfoliantYesterday) return CycleDay.RECOVERY;
    
    // 2. Goal Overrides
    if (selectedGoal === SkinGoal.BARRIER_REPAIR) return CycleDay.RECOVERY;

    // 3. Default Cycling (based on mod 4)
    if (history.length === 0) return CycleDay.EXFOLIATION;
    const uniqueDays = Array.from(new Set(history.map(h => h.date.split('T')[0]))).length;
    const cycleIndex = uniqueDays % 4;

    if (cycleIndex === 0) return CycleDay.EXFOLIATION;
    if (cycleIndex === 1) return CycleDay.RETINOID;
    return CycleDay.RECOVERY;
  }, [history, selectedGoal, historyAnalysis]);

  const generateRoutine = useCallback(() => {
    if (products.length === 0) {
      setRoutine([]);
      return;
    }

    const newRoutine: RoutineStep[] = [];
    let stepCount = 1;
    let clayMaskUsed = false;

    // --- CATEGORIZATION & CONFLICT RESOLUTION ---
    // If today is Exfoliation day, Retinoids are hidden/disabled.
    // If today is Retinoid day, Acids are hidden.
    
    let allowAcids = currentCycle === CycleDay.EXFOLIATION;
    let allowRetinoids = currentCycle === CycleDay.RETINOID;
    
    // Safety check: Never both
    if (allowAcids && allowRetinoids) allowRetinoids = false;

    const cleansers = products.filter(p => p.category === IngredientCategory.CLEANSER);
    const acids = allowAcids ? products.filter(p => p.category === IngredientCategory.ACID_EXFOLIANT) : [];
    const clays = allowAcids ? products.filter(p => p.category === IngredientCategory.CLAY_MASK) : [];
    const retinoids = allowRetinoids ? products.filter(p => p.category === IngredientCategory.RETINOID) : [];
    const essences = products.filter(p => p.category === IngredientCategory.SERUM_WATER || p.category === IngredientCategory.SOOTHING_BARRIER);
    const moisturizers = products.filter(p => p.category === IngredientCategory.MOISTURIZER);

    // --- STEP 1: CLEANSE ---
    if (cleansers.length > 0) {
      newRoutine.push({
        step: stepCount++,
        product: cleansers[0],
        deviceMode: DeviceMode.NONE,
        level: 0,
        why: 'Start with a clean canvas. Emulsify thoroughly.',
        guruInsight: 'Double cleansing is the secret to the "Glass Skin" look.'
      });
    }

    // --- STEP 2: AIR SHOT (Dry Skin Only) ---
    // Conditions: Device ON, No Cooldown, High Humidity OR Clear Pores Goal.
    if (useDevice && !historyAnalysis.airShotCooldown && (humidity > 70 || selectedGoal === SkinGoal.CLEAR_PORES)) {
      newRoutine.push({
        step: stepCount++,
        product: { id: 'medicube-as', brand: 'Medicube', name: 'Air Shot Mode', category: IngredientCategory.ACID_EXFOLIANT },
        deviceMode: DeviceMode.AIR_SHOT,
        level: 1,
        why: 'Use on completely dry skin before toner. Brush tip lightly.',
        guruInsight: historyAnalysis.airShotCooldown ? 'Skipped: Skin is in recovery window.' : 'HK humidity is high; keeping pores clear is priority.'
      });
    }

    // --- STEP 3: PREP (Toner/Essence) ---
    const toner = essences.find(p => p.name.toLowerCase().includes('toner'));
    if (toner) {
      newRoutine.push({
        step: stepCount++,
        product: toner,
        deviceMode: DeviceMode.NONE,
        level: 0,
        why: 'Hydrate and rebalance pH.',
        guruInsight: 'Damp skin absorbs actives 10x better.'
      });
    }

    // --- STEP 4: TREAT (Exfoliant OR Retinoid) ---
    if (allowAcids) {
      const exfoliant = acids[0] || clays[0];
      if (exfoliant) {
        if (exfoliant.category === IngredientCategory.CLAY_MASK) clayMaskUsed = true;
        newRoutine.push({
          step: stepCount++,
          product: exfoliant,
          deviceMode: DeviceMode.NONE,
          level: 0,
          why: clayMaskUsed ? 'Deep pore suction. Wash off after 10 mins.' : 'Chemical desquamation.',
          guruInsight: 'We are using this instead of Retinol tonight to avoid irritation.'
        });
      }
    } else if (allowRetinoids) {
      const retinol = retinoids[0];
      if (retinol) {
        let mode = DeviceMode.NONE;
        // Booster logic: Use with Retinol if user isn't sensitive? 
        // Prompt says "Level 1 for Retinol".
        if (useDevice) mode = DeviceMode.BOOSTER;
        
        newRoutine.push({
          step: stepCount++,
          product: retinol,
          deviceMode: mode,
          level: 1,
          why: mode === DeviceMode.BOOSTER ? 'Booster mode enhances Vitamin A delivery.' : 'Apply a pea-sized amount.',
          guruInsight: 'Anti-aging powerhouse. We keep the device level low to prevent redness.'
        });
      }
    }

    // --- STEP 5: HYDRATE (Booster Mode) ---
    const serum = essences.find(p => p !== toner && !newRoutine.some(r => r.product.id === p.id));
    if (serum) {
      let mode = DeviceMode.NONE;
      // Logic: If Clay Mask was used, disable Booster (risk of over-stripping/sensitivity).
      if (useDevice && !clayMaskUsed) mode = DeviceMode.BOOSTER;

      newRoutine.push({
        step: stepCount++,
        product: serum,
        deviceMode: mode,
        level: 3, // High level for hydration
        why: mode === DeviceMode.BOOSTER ? 'Drive moisture deep into the dermis.' : 'Pat gently.',
        guruInsight: clayMaskUsed ? 'Skipping Booster Mode after Clay Mask to protect barrier.' : 'Hyaluronic acid loves Booster mode.'
      });
    }

    // --- STEP 6: MOISTURIZE & LIFT (MC/Derma) ---
    const moisturizer = moisturizers[0];
    if (moisturizer) {
      let mode = DeviceMode.NONE;
      let why = 'Seal it all in.';
      
      if (useDevice) {
        if (selectedGoal === SkinGoal.ANTI_AGING) {
          mode = DeviceMode.MC_DERMA; // Derma Shot logic
          why = 'Use Derma Shot on jawline and masseters for lifting.';
        } else {
          mode = DeviceMode.MC_DERMA; // Generic MC logic
          why = 'Use Microcurrent with upward pulling motions.';
        }
      }

      newRoutine.push({
        step: stepCount++,
        product: moisturizer,
        deviceMode: mode,
        level: 2,
        why: why,
        guruInsight: 'The cream acts as a conductor for the EMS/Microcurrent.'
      });
    }

    setRoutine(newRoutine);
  }, [products, historyAnalysis, humidity, useDevice, currentCycle, selectedGoal]);

  useEffect(() => {
    generateRoutine();
  }, [generateRoutine]);

  const handleScanProduct = async () => {
    setIsScanning(true);
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = (reader.result as string).split(',')[1];
          try {
            const analysis = await geminiService.analyzeProduct(base64);
            const newProduct: Product = {
              id: Math.random().toString(36).substring(7),
              ...analysis
            };
            const updated = [...products, newProduct];
            setProducts(updated);
            storage.saveShelf(updated);
          } catch (err) {
            alert("Analysis failed. Try clearer lighting.");
          } finally {
            setIsScanning(false);
          }
        };
        reader.readAsDataURL(file);
      } else {
        setIsScanning(false);
      }
    };
    input.click();
  };

  const saveManualProduct = async () => {
    if (!manualProduct.brand || !manualProduct.name) return;
    setIsSearching(true);
    try {
      const analysis = await geminiService.analyzeProduct(undefined, { 
        brand: manualProduct.brand, 
        name: manualProduct.name 
      });
      const newProduct: Product = {
        id: Math.random().toString(36).substring(7),
        ...analysis
      };
      const updated = [...products, newProduct];
      setProducts(updated);
      storage.saveShelf(updated);
      setIsManualModalOpen(false);
      setManualProduct({ brand: '', name: '' });
    } catch (err) {
      alert("Consultation failed.");
    } finally {
      setIsSearching(false);
    }
  };

  const deleteProduct = (id: string) => {
    const updated = products.filter(p => p.id !== id);
    setProducts(updated);
    storage.saveShelf(updated);
  };

  const completeRoutine = () => {
    routine.forEach(step => {
      storage.addHistoryEntry({
        date: new Date().toISOString(),
        deviceMode: step.deviceMode,
        categoryUsed: step.product.category
      });
    });
    setHistory(storage.getHistory());
    alert("Routine logged to history.");
  };

  const handleShare = () => {
    const date = new Date().toLocaleDateString();
    let text = `🌟 My SkinLog Routine - ${date}\nTarget: ${selectedGoal}\n\n`;
    
    routine.forEach(step => {
      text += `${step.step}. ${step.product.brand} ${step.product.name}`;
      if (step.deviceMode !== DeviceMode.NONE) text += ` [${step.deviceMode}]`;
      text += `\n`;
    });

    text += `\nGenerated by SkinLog`;
    navigator.clipboard.writeText(text);
    setJustShared(true);
    setTimeout(() => setJustShared(false), 2000);
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#F5EBE0] pb-32 relative overflow-x-hidden selection:bg-[#A3B18A] font-sans">
      <header className="px-6 pt-12 pb-8 flex flex-col items-center text-center gap-2">
        <div className="bg-white/40 p-3 rounded-full mb-2 border border-white/50 shadow-sm backdrop-blur-sm animate-pulse">
            <Sparkles className="w-8 h-8 text-[#588157]" />
        </div>
        <h1 className="text-5xl font-serif text-[#588157] font-bold tracking-tighter italic">
            SkinLog
        </h1>
        <p className="text-[10px] tracking-[0.3em] text-[#A98467] font-bold uppercase flex items-center gap-2 bg-white/50 px-4 py-1.5 rounded-full border border-white/40 shadow-sm">
            <Heart className="w-3 h-3 fill-[#A98467]" /> Your Beauty AI <Heart className="w-3 h-3 fill-[#A98467]" />
        </p>
      </header>

      <main className="px-6">
        {activeTab === 'routine' && (
          <section className="animate-in slide-in-from-bottom duration-500">
            {/* Goal Selector */}
            <div className="mb-8 overflow-x-auto no-scrollbar">
              <div className="flex gap-3 min-w-max pb-2 justify-center">
                {Object.values(SkinGoal).map((goal) => (
                  <button
                    key={goal}
                    onClick={() => setSelectedGoal(goal)}
                    className={`py-3 px-5 rounded-2xl text-xs font-bold transition-all border whitespace-nowrap flex items-center gap-2 ${
                      selectedGoal === goal 
                      ? 'bg-[#588157] text-white border-[#588157] shadow-lg scale-105 italic' 
                      : 'bg-white text-stone-500 border-stone-100'
                    }`}
                  >
                     {selectedGoal === goal && <Star className="w-3 h-3 fill-current" />}
                    {goal}
                  </button>
                ))}
              </div>
            </div>

            {/* Smart Device Toggle - Central Feature */}
            <div className="mb-8 relative">
              <div className={`p-6 rounded-[2rem] transition-all duration-300 border ${useDevice ? 'bg-white border-[#588157]/30 shadow-xl' : 'bg-stone-100 border-stone-200'}`}>
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-serif text-lg text-stone-800 font-bold italic flex items-center gap-2">
                        <Wand2 className="w-4 h-4 text-[#D4A373]" /> Medicube Device
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5 italic">
                      {!useDevice && 'Manual Application Only'}
                    </p>
                  </div>
                  <button 
                    onClick={() => setUseDevice(!useDevice)}
                    className={`w-14 h-8 rounded-full transition-all relative ${useDevice ? 'bg-[#588157]' : 'bg-stone-300'}`}
                  >
                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-sm ${useDevice ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* History Constraint Alert */}
            {historyAnalysis.usedExfoliantYesterday && (
              <div className="mb-6 bg-rose-50 border border-rose-100 p-4 rounded-[1.5rem] flex items-start gap-3 shadow-sm">
                <div className="p-2 bg-white rounded-full shadow-sm">
                    <AlertTriangle className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-rose-700 uppercase tracking-wide italic">Recovery Mode Enforced</h4>
                  <p className="text-xs text-rose-600 mt-1">Exfoliants detected yesterday. Active ingredients are paused today to protect your barrier.</p>
                </div>
              </div>
            )}

            {routine.length > 0 ? (
              <>
                <div className="flex justify-between items-end mb-4 px-2">
                   <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#D4A373]" />
                    <span className="text-sm font-bold text-[#A98467] uppercase tracking-widest italic">Today's Protocol</span>
                   </div>
                   <button onClick={handleShare} className="text-[#588157] p-2 hover:bg-[#588157]/10 rounded-full transition-colors bg-white shadow-sm border border-stone-100">
                     {justShared ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                   </button>
                </div>
                
                {routine.map((step, idx) => (
                  <RoutineCard key={idx} step={step} />
                ))}

                <button onClick={completeRoutine} className="w-full bg-[#588157] text-white py-5 rounded-[2.5rem] font-bold shadow-xl shadow-[#588157]/20 mt-8 flex items-center justify-center gap-3 active:scale-95 transition-all text-lg italic">
                  <Check className="w-6 h-6" />
                  Log Routine
                </button>
              </>
            ) : (
              <div className="bg-white border-2 border-dashed border-stone-200 rounded-[3rem] p-12 text-center">
                <p className="text-stone-400 text-sm font-medium mb-4 italic">Your digital shelf is empty.</p>
                <button onClick={() => setActiveTab('shelf')} className="text-[#588157] font-bold text-sm underline italic flex items-center justify-center gap-2 mx-auto">
                    <Plus className="w-4 h-4" /> Add products to start
                </button>
              </div>
            )}
          </section>
        )}

        {activeTab === 'shelf' && (
          <section className="animate-in slide-in-from-bottom duration-500">
            <div className="flex flex-col gap-6 mb-8">
              <h2 className="text-3xl font-serif text-stone-800 font-bold italic flex items-center gap-3 justify-center">
                  <BookOpen className="w-7 h-7 text-[#D4A373]" />
                  Digital Shelf
              </h2>
              <div className="flex gap-4">
                <button onClick={handleScanProduct} disabled={isScanning} className="flex-1 bg-[#2d2d2d] text-white py-5 rounded-[2rem] shadow-lg hover:bg-black disabled:opacity-50 flex items-center justify-center gap-3 text-sm font-bold transition-all">
                  {isScanning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />} AI Scan
                </button>
                <button onClick={() => setIsManualModalOpen(true)} className="flex-1 bg-white text-stone-800 border border-stone-200 py-5 rounded-[2rem] shadow-sm hover:bg-stone-50 flex items-center justify-center gap-3 text-sm font-bold transition-all">
                  <Plus className="w-5 h-5" /> Manual Add
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {products.map(p => (
                <div key={p.id} className="bg-white p-5 rounded-[2rem] shadow-sm border border-stone-100 flex items-center gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-stone-50 flex-shrink-0 overflow-hidden shadow-inner">
                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-grow">
                    <span className="text-[10px] font-bold text-[#A98467] uppercase tracking-wider bg-[#F5EBE0] px-2 py-1 rounded-full">{p.category}</span>
                    <h4 className="font-bold text-stone-800 text-base leading-tight mt-1.5 italic">{p.brand}</h4>
                    <p className="text-stone-500 text-xs italic line-clamp-1">{p.name}</p>
                  </div>
                  <button onClick={() => deleteProduct(p.id)} className="text-stone-300 hover:text-rose-400 p-2 transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'profile' && (
          <section className="animate-in slide-in-from-bottom duration-500">
            <h2 className="text-3xl font-serif text-stone-800 font-bold mb-8 italic flex items-center gap-3 justify-center">
                <History className="w-7 h-7 text-[#D4A373]" />
                Skin Journey
            </h2>
            <div className="space-y-4">
              {history.length > 0 ? history.slice().reverse().map((h, i) => (
                <div key={i} className="bg-white p-5 rounded-[2rem] border border-stone-100 flex justify-between items-center shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#E9EDC9] flex items-center justify-center text-[#588157]">
                      <Target className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">{new Date(h.date).toLocaleDateString()}</span>
                      <p className="font-bold text-stone-800 text-sm italic">{h.deviceMode}</p>
                    </div>
                  </div>
                  {h.deviceMode === DeviceMode.AIR_SHOT && <div className="w-3 h-3 rounded-full bg-blue-300 shadow-sm"></div>}
                  {h.deviceMode === DeviceMode.BOOSTER && <div className="w-3 h-3 rounded-full bg-orange-300 shadow-sm"></div>}
                  {h.deviceMode === DeviceMode.MC_DERMA && <div className="w-3 h-3 rounded-full bg-purple-300 shadow-sm"></div>}
                </div>
              )).slice(0, 10) : <p className="text-center text-stone-400 py-12 italic text-sm">No routines logged yet.</p>}
            </div>
          </section>
        )}
      </main>

      {/* Manual Entry Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-serif text-stone-800 font-bold italic flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#D4A373]" /> Add Product
              </h3>
              <button onClick={() => setIsManualModalOpen(false)}><X className="w-6 h-6 text-stone-400 hover:text-stone-800" /></button>
            </div>
            <div className="space-y-4">
              <input 
                type="text" 
                placeholder="Brand (e.g. CeraVe)" 
                className="w-full bg-stone-50 border border-stone-200 p-5 rounded-2xl text-sm outline-none focus:border-[#588157] italic transition-all" 
                value={manualProduct.brand} 
                onChange={(e) => setManualProduct({...manualProduct, brand: e.target.value})} 
              />
              <input 
                type="text" 
                placeholder="Product Name" 
                className="w-full bg-stone-50 border border-stone-200 p-5 rounded-2xl text-sm outline-none focus:border-[#588157] italic transition-all" 
                value={manualProduct.name} 
                onChange={(e) => setManualProduct({...manualProduct, name: e.target.value})} 
              />
              <button 
                onClick={saveManualProduct} 
                disabled={isSearching} 
                className="w-full bg-[#588157] text-white py-5 rounded-[2rem] font-bold shadow-lg flex items-center justify-center gap-3 mt-4 text-lg italic hover:scale-105 transition-transform"
              >
                {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                {isSearching ? 'Categorizing...' : 'Add to Shelf'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="fixed bottom-8 left-8 right-8 h-20 bg-white/90 backdrop-blur-xl rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/50 flex items-center justify-around px-2 z-50">
        <button onClick={() => setActiveTab('routine')} className={`p-4 rounded-full transition-all ${activeTab === 'routine' ? 'bg-[#588157] text-white shadow-lg scale-110 -translate-y-2' : 'text-stone-300 hover:text-stone-400'}`}>
          <Sparkles className="w-7 h-7" />
        </button>
        <button onClick={() => setActiveTab('shelf')} className={`p-4 rounded-full transition-all ${activeTab === 'shelf' ? 'bg-[#588157] text-white shadow-lg scale-110 -translate-y-2' : 'text-stone-300 hover:text-stone-400'}`}>
          <BookOpen className="w-7 h-7" />
        </button>
        <button onClick={() => setActiveTab('profile')} className={`p-4 rounded-full transition-all ${activeTab === 'profile' ? 'bg-[#588157] text-white shadow-lg scale-110 -translate-y-2' : 'text-stone-300 hover:text-stone-400'}`}>
          <User className="w-7 h-7" />
        </button>
      </nav>
    </div>
  );
};

export default App;
