// Custom hook for AIM Glide Calculator state management
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  type CalculatorInputs,
  type SavedCalculation,
  DEFAULT_INPUTS,
  CLEARED_INPUTS,
  STORAGE_KEY,
  calculateTCO,
} from '@/lib/calculator';
import { useAuthStore } from '@/store/authStore';
import { useRoiCalculationsStore } from '@/store/roiCalculationsStore';
import { importLegacyRoiCalculationsForUser } from '@/lib/importLegacyRoiCalculations';

export function useCalculator() {
  const [inputs, setInputs] = useState<CalculatorInputs>(DEFAULT_INPUTS);
  const [benefitYears, setBenefitYears] = useState(5);
  const [dataSaved, setDataSaved] = useState(true);
  const [previousInputs, setPreviousInputs] = useState<CalculatorInputs | null>(null);
  const [showUndo, setShowUndo] = useState(false);
  const initialLoadDone = useRef(false);

  const { user } = useAuthStore();
  const uid = user?.uid;
  const { calculations, subscribe, unsubscribe, save, remove } = useRoiCalculationsStore();

  // Named/saved calculations live in Firestore (cross-device); the in-progress
  // draft below stays local since it's unsaved scratch work, not worth a cloud
  // write on every keystroke.
  const savedCalculations: SavedCalculation[] = calculations.map((c) => ({
    name: c.name,
    data: c.data,
    savedAt: new Date(c.updatedAt).toISOString(),
  }));

  useEffect(() => {
    if (!uid) return
    subscribe(uid)
    importLegacyRoiCalculationsForUser(uid, calculations).catch((err) =>
      console.error('[importLegacyRoiCalculations]', err)
    )
    return () => unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid])

  // Load in-progress draft on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setInputs(prev => ({ ...prev, ...parsed }));
      } catch {
        // ignore parse errors
      }
    }
    initialLoadDone.current = true;
  }, []);

  // Auto-save in-progress draft to localStorage
  useEffect(() => {
    if (!initialLoadDone.current) return;
    const t = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(inputs));
      setDataSaved(true);
    }, 500);
    return () => clearTimeout(t);
  }, [inputs]);

  const handleInputChange = useCallback((field: keyof CalculatorInputs, value: any) => {
    setDataSaved(false);
    setInputs(prev => ({ ...prev, [field]: value }));
  }, []);

  const clearAllInputs = useCallback(() => {
    setPreviousInputs({ ...inputs });
    setShowUndo(true);
    setInputs(CLEARED_INPUTS);
    localStorage.removeItem(STORAGE_KEY);
    setDataSaved(true);
    return true;
  }, [inputs]);

  const handleUndo = useCallback(() => {
    if (previousInputs) {
      setInputs(previousInputs);
      setPreviousInputs(null);
      setShowUndo(false);
    }
  }, [previousInputs]);

  const saveCalculation = useCallback(() => {
    const name = inputs.customerName && inputs.projectName
      ? `${inputs.customerName} | ${inputs.projectName}`
      : inputs.customerName || inputs.projectName || `Calculation ${new Date().toLocaleDateString()}`;
    const existingIndex = calculations.findIndex(s => s.name === name);
    if (existingIndex >= 0) {
      // Return name for confirmation dialog
      return { needsConfirm: true, name, existingIndex };
    }
    const now = Date.now();
    save({ id: crypto.randomUUID(), name, data: { ...inputs }, createdAt: now, updatedAt: now });
    return { needsConfirm: false, name };
  }, [inputs, calculations, save]);

  const confirmSaveOverwrite = useCallback((name: string, existingIndex: number) => {
    const existing = calculations[existingIndex];
    if (!existing) return;
    save({ ...existing, name, data: { ...inputs }, updatedAt: Date.now() });
  }, [inputs, calculations, save]);

  const loadCalculation = useCallback((calc: SavedCalculation) => {
    setInputs(calc.data);
  }, []);

  const deleteCalculation = useCallback((calcName: string) => {
    const existing = calculations.find(s => s.name === calcName);
    if (!existing) return;
    remove(existing.id);
  }, [calculations, remove]);

  const addNote = useCallback(() => {
    setDataSaved(false);
    setInputs(prev => ({ ...prev, notes: [...prev.notes, ''] }));
  }, []);

  const updateNote = useCallback((index: number, value: string) => {
    setDataSaved(false);
    setInputs(prev => ({
      ...prev,
      notes: prev.notes.map((n, i) => i === index ? value : n),
    }));
  }, []);

  const removeNote = useCallback((index: number) => {
    setDataSaved(false);
    setInputs(prev => ({
      ...prev,
      notes: prev.notes.length === 1 ? [''] : prev.notes.filter((_, i) => i !== index),
    }));
  }, []);

  const tco = calculateTCO(inputs, benefitYears);

  return {
    inputs,
    tco,
    benefitYears,
    setBenefitYears,
    dataSaved,
    showUndo,
    setShowUndo,
    savedCalculations,
    handleInputChange,
    clearAllInputs,
    handleUndo,
    saveCalculation,
    confirmSaveOverwrite,
    loadCalculation,
    deleteCalculation,
    addNote,
    updateNote,
    removeNote,
  };
}
