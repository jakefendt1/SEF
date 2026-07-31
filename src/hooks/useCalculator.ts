// Custom hook for AIM Glide Calculator state management
import { useState, useEffect, useCallback } from 'react';
import {
  type CalculatorInputs,
  type SavedCalculation,
  EXAMPLE_INPUTS,
  CLEARED_INPUTS,
  STORAGE_KEY,
  calculateTCO,
} from '@/lib/calculator';
import { useRoiCalculationsStore } from '@/store/roiCalculationsStore';

/**
 * Read the in-progress draft from localStorage. Done as a lazy initialiser
 * rather than in an effect so the first paint already shows the user's work --
 * an effect would render an empty form, then replace it.
 */
function loadDraft(): CalculatorInputs {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return CLEARED_INPUTS;
    return { ...CLEARED_INPUTS, ...JSON.parse(saved) };
  } catch {
    // A corrupt draft must not stop the calculator from opening.
    return CLEARED_INPUTS;
  }
}

export function useCalculator() {
  // Starts empty, never with invented numbers. A blank calculator is honest;
  // a prefilled one can be exported to a customer as if it were their data.
  const [inputs, setInputs] = useState<CalculatorInputs>(loadDraft);
  const [benefitYears, setBenefitYears] = useState(5);
  const [dataSaved, setDataSaved] = useState(true);
  const [previousInputs, setPreviousInputs] = useState<CalculatorInputs | null>(null);
  const [showUndo, setShowUndo] = useState(false);

  // The subscription itself lives in AppShell so both the dashboard and this
  // page see the same list; here we only read it.
  const { calculations, save, remove } = useRoiCalculationsStore();

  // Named/saved calculations live in Firestore (cross-device); the in-progress
  // draft below stays local since it's unsaved scratch work, not worth a cloud
  // write on every keystroke.
  const savedCalculations: SavedCalculation[] = calculations.map((c) => ({
    name: c.name,
    data: c.data,
    savedAt: new Date(c.updatedAt).toISOString(),
  }));

  // Auto-save in-progress draft to localStorage
  useEffect(() => {
    const t = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(inputs));
      setDataSaved(true);
    }, 500);
    return () => clearTimeout(t);
  }, [inputs]);

  const handleInputChange = useCallback(<K extends keyof CalculatorInputs>(field: K, value: CalculatorInputs[K]) => {
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

  const loadExampleInputs = useCallback(() => {
    setPreviousInputs({ ...inputs });
    setShowUndo(true);
    // Keep whatever the user already typed about *who* this is for -- only the
    // numbers are examples.
    setInputs(prev => ({
      ...EXAMPLE_INPUTS,
      customerName: prev.customerName,
      projectName: prev.projectName,
      plantLocation: prev.plantLocation,
      preparedBy: prev.preparedBy,
    }));
    setDataSaved(false);
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
    setDataSaved(false);
  }, []);

  // Keyed by id, not name: names are user-visible, duplicable and renameable,
  // so they were never a safe identity.
  const loadCalculationById = useCallback((id: string) => {
    const existing = calculations.find(c => c.id === id);
    if (!existing) return false;
    setPreviousInputs({ ...inputs });
    setShowUndo(true);
    setInputs(existing.data);
    setDataSaved(false);
    return true;
  }, [calculations, inputs]);

  const deleteCalculation = useCallback((id: string) => {
    remove(id);
  }, [remove]);

  const renameCalculation = useCallback((id: string, name: string) => {
    const existing = calculations.find(c => c.id === id);
    if (!existing) return;
    save({ ...existing, name: name.trim(), updatedAt: Date.now() });
  }, [calculations, save]);

  const duplicateCalculation = useCallback((id: string) => {
    const existing = calculations.find(c => c.id === id);
    if (!existing) return;
    const now = Date.now();
    save({
      id: crypto.randomUUID(),
      name: `${existing.name} (Copy)`,
      data: structuredClone(existing.data),
      createdAt: now,
      updatedAt: now,
    });
  }, [calculations, save]);

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
    calculations,
    handleInputChange,
    clearAllInputs,
    loadExampleInputs,
    handleUndo,
    saveCalculation,
    confirmSaveOverwrite,
    loadCalculation,
    loadCalculationById,
    deleteCalculation,
    renameCalculation,
    duplicateCalculation,
    addNote,
    updateNote,
    removeNote,
  };
}
