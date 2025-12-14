import { useEffect, useCallback, useRef } from 'react';
import type { CharacterFormData } from '@/pages/CharacterCreate';

const STORAGE_KEY = 'character-creation-draft';
const DEBOUNCE_MS = 1000;

interface AutoSaveData {
  formData: CharacterFormData;
  currentStep: number;
  savedAt: number;
}

export function useCharacterAutoSave(
  formData: CharacterFormData,
  currentStep: number,
  enabled: boolean = true
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Save to localStorage
  const save = useCallback(() => {
    if (!enabled) return;
    
    const data: AutoSaveData = {
      formData,
      currentStep,
      savedAt: Date.now(),
    };
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save character draft:', error);
    }
  }, [formData, currentStep, enabled]);

  // Debounced auto-save on formData change
  useEffect(() => {
    if (!enabled) return;
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(save, DEBOUNCE_MS);
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [formData, currentStep, save, enabled]);

  return { save };
}

export function loadCharacterDraft(): AutoSaveData | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    
    const data: AutoSaveData = JSON.parse(stored);
    
    // Check if draft is less than 7 days old
    const weekInMs = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - data.savedAt > weekInMs) {
      clearCharacterDraft();
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Failed to load character draft:', error);
    return null;
  }
}

export function clearCharacterDraft(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear character draft:', error);
  }
}

export function hasCharacterDraft(): boolean {
  return loadCharacterDraft() !== null;
}
