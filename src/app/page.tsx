'use client';

import { useCallback, useEffect, useState } from 'react';
import { Sparkles, Upload, PersonStanding, Settings, Wand2, Eye, Download, ChevronRight } from 'lucide-react';
import { Toaster } from 'sonner';
import { useAppStore } from '@/lib/store';
import type { Project } from '@/lib/types';
import { ProjectSelector } from '@/components/project-selector';
import { UploadStep } from '@/components/steps/upload-step';
import { PoseStep } from '@/components/steps/pose-step';
import { ConfigureStep } from '@/components/steps/configure-step';
import { GenerateStep } from '@/components/steps/generate-step';
import { PreviewStep } from '@/components/steps/preview-step';
import { ExportStep } from '@/components/steps/export-step';

const STEPS = [
  { label: '上传素材', icon: Upload, emoji: '📤' },
  { label: '选择姿势', icon: PersonStanding, emoji: '🧍' },
  { label: '参数配置', icon: Settings, emoji: '⚙️' },
  { label: '生成图片', icon: Wand2, emoji: '🎨' },
  { label: '结果预览', icon: Eye, emoji: '👁️' },
  { label: '导出下载', icon: Download, emoji: '📥' },
];

export default function Home() {
  const { currentProjectId, currentStep, setCurrentStep } = useAppStore();
  const [viewTaskId, setViewTaskId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch project when currentProjectId changes
  const [fetchedProject, setFetchedProject] = useState<Project | null>(null);

  useEffect(() => {
    const id = currentProjectId;
    if (!id) return;
    let cancelled = false;
    fetch(`/api/projects/${id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) setFetchedProject(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [currentProjectId, refreshKey]);

  const project = currentProjectId ? fetchedProject : null;

  const fetchProject = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const handleProjectChange = useCallback(
    (_project: Project) => {
      // Trigger refetch for the new project
      setRefreshKey((k) => k + 1);
    },
    []
  );

  const handleStartGeneration = useCallback(() => {
    setCurrentStep(3); // Go to generate step
  }, [setCurrentStep]);

  const handleViewResults = useCallback(
    (taskId: string) => {
      setViewTaskId(taskId);
      setCurrentStep(4); // Go to preview step
    },
    [setCurrentStep]
  );

  const isStepReady = (step: number): boolean => {
    switch (step) {
      case 0:
        return !!currentProjectId;
      case 1:
        return !!currentProjectId;
      case 2:
        return (
          !!useAppStore.getState().selectedModelImageId &&
          !!useAppStore.getState().selectedGarmentImageId
        );
      case 3:
        return (
          !!useAppStore.getState().selectedModelImageId &&
          !!useAppStore.getState().selectedGarmentImageId
        );
      case 4:
        return project?.generationTasks?.some(
          (t) => t.status === 'completed'
        ) ?? false;
      case 5:
        return project?.generationTasks?.some(
          (t) => t.status === 'completed'
        ) ?? false;
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <UploadStep project={project} onRefresh={fetchProject} />;
      case 1:
        return <PoseStep />;
      case 2:
        return (
          <ConfigureStep
            project={project}
            onStartGeneration={handleStartGeneration}
          />
        );
      case 3:
        return (
          <GenerateStep
            project={project}
            onRefresh={fetchProject}
            onViewResults={handleViewResults}
          />
        );
      case 4:
        return <PreviewStep project={project} taskId={viewTaskId} />;
      case 5:
        return <ExportStep project={project} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="rounded-lg bg-gradient-to-br from-rose-400 to-pink-500 p-1.5 shadow-sm">
                <Sparkles className="size-4 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold text-gray-900 leading-tight">
                  AI 模特换装
                </h1>
                <p className="text-[10px] text-gray-400 leading-tight hidden sm:flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-violet-500" />
                  Powered by Z-Image 造相
                </p>
              </div>
            </div>

            {/* Project Selector */}
            <ProjectSelector onProjectChange={handleProjectChange} />
          </div>
        </div>
      </header>

      {/* Step Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center overflow-x-auto py-2 gap-0 scrollbar-hide">
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isActive = currentStep === idx;
              const ready = isStepReady(idx);

              return (
                <div key={idx} className="flex items-center shrink-0">
                  <button
                    onClick={() => setCurrentStep(idx)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-rose-50 text-rose-600 shadow-sm'
                        : ready
                          ? 'text-gray-600 hover:bg-gray-50 hover:text-rose-500'
                          : 'text-gray-300 hover:text-gray-400'
                    }`}
                  >
                    <Icon className="size-3.5" />
                    <span className="hidden sm:inline">{step.label}</span>
                    <span className="sm:hidden">{step.emoji}</span>
                    {isActive && (
                      <span className="hidden sm:inline w-1.5 h-1.5 rounded-full bg-rose-500" />
                    )}
                  </button>
                  {idx < STEPS.length - 1 && (
                    <ChevronRight className="size-3.5 text-gray-200 mx-0.5 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
        {!currentProjectId ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <div className="rounded-full bg-rose-50 p-6 mb-4">
              <Sparkles className="size-10 text-rose-300" />
            </div>
            <h2 className="text-xl font-semibold text-gray-500 mb-2">
              欢迎使用 AI 模特换装
            </h2>
            <p className="text-sm text-gray-400 mb-6 text-center max-w-md">
              选择或创建一个项目，开始体验 AI 驱动的模特换装和姿势裂变功能
            </p>
            <ProjectSelector onProjectChange={handleProjectChange} />
          </div>
        ) : (
          renderStep()
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-white py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            AI 模特换装 + 姿势裂变工具
          </p>
          <p className="text-xs text-gray-400">
            由 AI 驱动
          </p>
        </div>
      </footer>

      <Toaster position="top-right" richColors />
    </div>
  );
}
