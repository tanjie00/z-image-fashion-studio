'use client';

import { create } from 'zustand';
import type { GenerationParams, ZImageParams } from '@/lib/types';

interface AppState {
  currentProjectId: string | null;
  currentStep: number;
  selectedModelImageId: string | null;
  selectedGarmentImageId: string | null;
  selectedPoseId: string | null;
  generationParams: GenerationParams;
  zImageParams: ZImageParams;
  zImageOnline: boolean;
  setCurrentProjectId: (id: string | null) => void;
  setCurrentStep: (step: number) => void;
  setSelectedModelImageId: (id: string | null) => void;
  setSelectedGarmentImageId: (id: string | null) => void;
  setSelectedPoseId: (id: string | null) => void;
  setGenerationParams: (params: Partial<GenerationParams>) => void;
  setZImageParams: (params: Partial<ZImageParams>) => void;
  setZImageOnline: (online: boolean) => void;
  resetSelections: () => void;
}

const defaultGenerationParams: GenerationParams = {
  garmentStrength: 70,
  poseFollow: 80,
  faceConsistency: 90,
  batchSize: 1,
  prompt: '',
};

const defaultZImageParams: ZImageParams = {
  model: 'z-image',
  resolution: '864x1152 ( 3:4 )',
  numInferenceSteps: 30,
  guidanceScale: 4.0,
  cfgNormalization: false,
  randomSeed: true,
  seed: 42,
  negativePrompt: '',
};

export const useAppStore = create<AppState>((set) => ({
  currentProjectId: null,
  currentStep: 0,
  selectedModelImageId: null,
  selectedGarmentImageId: null,
  selectedPoseId: null,
  generationParams: { ...defaultGenerationParams },
  zImageParams: { ...defaultZImageParams },
  zImageOnline: false,
  setCurrentProjectId: (id) =>
    set({
      currentProjectId: id,
      selectedModelImageId: null,
      selectedGarmentImageId: null,
      selectedPoseId: null,
      generationParams: { ...defaultGenerationParams },
      zImageParams: { ...defaultZImageParams },
      currentStep: 0,
    }),
  setCurrentStep: (step) => set({ currentStep: step }),
  setSelectedModelImageId: (id) => set({ selectedModelImageId: id }),
  setSelectedGarmentImageId: (id) => set({ selectedGarmentImageId: id }),
  setSelectedPoseId: (id) => set({ selectedPoseId: id }),
  setGenerationParams: (params) =>
    set((state) => ({
      generationParams: { ...state.generationParams, ...params },
    })),
  setZImageParams: (params) =>
    set((state) => ({
      zImageParams: { ...state.zImageParams, ...params },
    })),
  setZImageOnline: (online) => set({ zImageOnline: online }),
  resetSelections: () =>
    set({
      selectedModelImageId: null,
      selectedGarmentImageId: null,
      selectedPoseId: null,
      generationParams: { ...defaultGenerationParams },
      zImageParams: { ...defaultZImageParams },
    }),
}));
