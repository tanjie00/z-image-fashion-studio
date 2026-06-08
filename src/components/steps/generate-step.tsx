'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Wand2,
  Play,
  Eye,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore } from '@/lib/store';
import type { GenerationTask, Project } from '@/lib/types';
import { toast } from 'sonner';

interface GenerateStepProps {
  project: Project | null;
  onRefresh: () => void;
  onViewResults: (taskId: string) => void;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: React.ReactNode; color: string; bgColor: string }
> = {
  pending: {
    label: '等待中',
    icon: <Clock className="size-3.5" />,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 border-amber-200',
  },
  processing: {
    label: '生成中',
    icon: <Loader2 className="size-3.5 animate-spin" />,
    color: 'text-rose-600',
    bgColor: 'bg-rose-50 border-rose-200',
  },
  completed: {
    label: '已完成',
    icon: <CheckCircle2 className="size-3.5" />,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50 border-emerald-200',
  },
  failed: {
    label: '失败',
    icon: <XCircle className="size-3.5" />,
    color: 'text-red-600',
    bgColor: 'bg-red-50 border-red-200',
  },
};

export function GenerateStep({
  project,
  onRefresh,
  onViewResults,
}: GenerateStepProps) {
  const {
    selectedModelImageId,
    selectedGarmentImageId,
    selectedPoseId,
    generationParams,
    zImageParams,
  } = useAppStore();

  const [tasks, setTasks] = useState<GenerationTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (project) params.set('projectId', project.id);
      const res = await fetch(`/api/generate?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [project]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    fetchTasks();
  }, [fetchTasks]);

  // Auto-refresh when processing
  const hasProcessing = tasks.some((t) => t.status === 'processing' || t.status === 'pending');
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!hasProcessing) return;
    const interval = setInterval(() => {
      fetchTasks();
    }, 3000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasProcessing]);

  const handleCreateTask = useCallback(async () => {
    if (!project || !selectedModelImageId || !selectedGarmentImageId) {
      toast.error('请先选择模特和服装图片');
      return;
    }
    setCreating(true);
    try {
      const body: Record<string, unknown> = {
        projectId: project.id,
        modelImageId: selectedModelImageId,
        garmentImageId: selectedGarmentImageId,
        params: JSON.stringify({
          garmentStrength: generationParams.garmentStrength,
          poseFollow: generationParams.poseFollow,
          faceConsistency: generationParams.faceConsistency,
          batchSize: generationParams.batchSize,
          // Z-Image specific params
          model: zImageParams.model,
          resolution: zImageParams.resolution,
          numInferenceSteps: zImageParams.numInferenceSteps,
          guidanceScale: zImageParams.guidanceScale,
          cfgNormalization: zImageParams.cfgNormalization,
          randomSeed: zImageParams.randomSeed,
          seed: zImageParams.seed,
          negativePrompt: zImageParams.negativePrompt,
        }),
      };
      if (selectedPoseId) body.poseTemplateId = selectedPoseId;
      if (generationParams.prompt) body.prompt = generationParams.prompt;

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const task = await res.json();
        toast.success('任务创建成功');
        await fetchTasks();
        // Auto-process
        handleProcess(task.id);
      } else {
        toast.error('创建任务失败');
      }
    } catch {
      toast.error('创建任务失败');
    } finally {
      setCreating(false);
    }
  }, [project, selectedModelImageId, selectedGarmentImageId, selectedPoseId, generationParams, zImageParams, fetchTasks]);

  const handleProcess = useCallback(
    async (taskId: string) => {
      setProcessing(taskId);
      try {
        const res = await fetch(`/api/generate/${taskId}/process`, {
          method: 'POST',
        });
        if (res.ok) {
          toast.success('生成任务已开始处理');
          fetchTasks();
        } else {
          toast.error('处理任务失败');
          fetchTasks();
        }
      } catch {
        toast.error('处理任务失败');
        fetchTasks();
      } finally {
        setProcessing(null);
      }
    },
    [fetchTasks]
  );

  const modelImage = project?.modelImages?.find(
    (img) => img.id === selectedModelImageId
  );
  const garmentImage = project?.garmentImages?.find(
    (img) => img.id === selectedGarmentImageId
  );

  const canCreate = project && selectedModelImageId && selectedGarmentImageId;

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-rose-100 p-1.5">
            <Wand2 className="size-4 text-rose-600" />
          </div>
          <h2 className="text-lg font-semibold">生成任务</h2>
        </div>
        <Button
          onClick={handleCreateTask}
          disabled={!canCreate || creating}
          className="bg-rose-500 hover:bg-rose-600 text-white gap-1.5"
        >
          {creating ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Plus className="size-4" />
          )}
          {creating ? '创建中...' : '新建任务'}
        </Button>
      </div>

      {/* Current Selection Summary */}
      {canCreate && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border">
          <div className="flex -space-x-2">
            {modelImage && (
              <img
                src={`/api/images/${modelImage.url}`}
                alt="模特"
                className="w-10 h-10 rounded-full border-2 border-white object-cover"
              />
            )}
            {garmentImage && (
              <img
                src={`/api/images/${garmentImage.url}`}
                alt="服装"
                className="w-10 h-10 rounded-full border-2 border-white object-cover"
              />
            )}
          </div>
          <div className="text-sm text-gray-600">
            <span>当前选择：模特 + 服装</span>
            <span className="text-gray-400 ml-2">点击「新建任务」开始生成</span>
          </div>
        </div>
      )}

      {!canCreate && (
        <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-lg border border-dashed">
          <Wand2 className="size-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">请先选择模特和服装图片</p>
          <p className="text-xs mt-1">返回上传步骤进行选择</p>
        </div>
      )}

      {/* Tasks List */}
      {tasks.length > 0 && (
        <div className="space-y-3">
          {tasks.map((task) => {
            const statusConfig = STATUS_CONFIG[task.status] ?? STATUS_CONFIG.pending;
            const taskModel = project?.modelImages?.find(
              (img) => img.id === task.modelImageId
            );
            const taskGarment = project?.garmentImages?.find(
              (img) => img.id === task.garmentImageId
            );
            const isProcessing = processing === task.id;

            return (
              <Card key={task.id} className="overflow-hidden py-0 gap-0">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Thumbnails */}
                    <div className="flex -space-x-1 shrink-0">
                      {taskModel && (
                        <img
                          src={`/api/images/${taskModel.url}`}
                          alt="模特"
                          className="w-12 h-12 rounded-lg border-2 border-white object-cover shadow-sm"
                        />
                      )}
                      {taskGarment && (
                        <img
                          src={`/api/images/${taskGarment.url}`}
                          alt="服装"
                          className="w-12 h-12 rounded-lg border-2 border-white object-cover shadow-sm"
                        />
                      )}
                    </div>

                    {/* Task Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant="outline"
                          className={`${statusConfig.bgColor} ${statusConfig.color} border-0 text-[10px] gap-1`}
                        >
                          {statusConfig.icon}
                          {statusConfig.label}
                        </Badge>
                        {task.results?.length > 0 && (
                          <Badge variant="secondary" className="text-[10px]">
                            {task.results.length} 张结果
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">
                        创建于{' '}
                        {new Date(task.createdAt).toLocaleString('zh-CN')}
                      </p>
                      {task.status === 'processing' && (
                        <Progress value={undefined} className="mt-2 h-1.5 [&>div]:bg-rose-500" />
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 shrink-0">
                      {task.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => handleProcess(task.id)}
                          disabled={isProcessing}
                          className="bg-rose-500 hover:bg-rose-600 text-white gap-1"
                        >
                          {isProcessing ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Play className="size-3.5" />
                          )}
                          处理
                        </Button>
                      )}
                      {task.status === 'completed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onViewResults(task.id)}
                          className="gap-1"
                        >
                          <Eye className="size-3.5" />
                          查看结果
                        </Button>
                      )}
                      {task.status === 'failed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleProcess(task.id)}
                          className="gap-1"
                        >
                          <Play className="size-3.5" />
                          重试
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {tasks.length === 0 && canCreate && (
        <div className="text-center py-12 text-gray-400">
          <Wand2 className="size-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm">暂无生成任务</p>
          <p className="text-xs mt-1">点击上方「新建任务」开始</p>
        </div>
      )}
    </div>
  );
}
