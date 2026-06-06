'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Eye,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  User,
  Shirt,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import type { GenerationTask, Project, GenerationResult } from '@/lib/types';

interface PreviewStepProps {
  project: Project | null;
  taskId?: string | null;
}

export function PreviewStep({ project, taskId }: PreviewStepProps) {
  const [tasks, setTasks] = useState<GenerationTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(
    taskId ?? null
  );
  const [currentResultIndex, setCurrentResultIndex] = useState(0);
  const [enlargeUrl, setEnlargeUrl] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (project) params.set('projectId', project.id);
      const res = await fetch(`/api/generate?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const completed = data.filter(
          (t: GenerationTask) => t.status === 'completed'
        );
        setTasks(completed);
        if (completed.length > 0) {
          setSelectedTaskId((prev) => prev ?? completed[0].id);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [project]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const currentTask = tasks.find((t) => t.id === selectedTaskId);
  const currentResults = currentTask?.results ?? [];
  const currentResult: GenerationResult | undefined =
    currentResults[currentResultIndex];

  const modelImage = project?.modelImages?.find(
    (img) => img.id === currentTask?.modelImageId
  );
  const garmentImage = project?.garmentImages?.find(
    (img) => img.id === currentTask?.garmentImageId
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="h-96 rounded-xl" />
        <Skeleton className="h-96 rounded-xl col-span-2" />
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <Eye className="size-12 mx-auto mb-3 opacity-20" />
        <p className="text-sm">暂无已完成的生成结果</p>
        <p className="text-xs mt-1">请先完成图片生成步骤</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <div className="rounded-full bg-rose-100 p-1.5">
          <Eye className="size-4 text-rose-600" />
        </div>
        <h2 className="text-lg font-semibold">结果预览</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task List */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">生成任务列表</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {tasks.map((task) => {
                const tModel = project?.modelImages?.find(
                  (img) => img.id === task.modelImageId
                );
                const tGarment = project?.garmentImages?.find(
                  (img) => img.id === task.garmentImageId
                );
                const isActive = task.id === selectedTaskId;

                return (
                  <div
                    key={task.id}
                    onClick={() => {
                      setSelectedTaskId(task.id);
                      setCurrentResultIndex(0);
                    }}
                    className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all ${
                      isActive
                        ? 'bg-rose-50 border-2 border-rose-300'
                        : 'border-2 border-transparent hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex -space-x-1 shrink-0">
                      {tModel && (
                        <img
                          src={`/api/images/${tModel.url}`}
                          alt="模特"
                          className="w-9 h-9 rounded-md border border-white object-cover"
                        />
                      )}
                      {tGarment && (
                        <img
                          src={`/api/images/${tGarment.url}`}
                          alt="服装"
                          className="w-9 h-9 rounded-md border border-white object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500">
                        {new Date(task.createdAt).toLocaleString('zh-CN')}
                      </p>
                      <Badge variant="secondary" className="text-[10px] mt-0.5">
                        {task.results?.length ?? 0} 张结果
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Preview Area */}
        <Card className="lg:col-span-2">
          <CardContent className="p-4">
            {currentTask && currentResult ? (
              <div className="space-y-4">
                {/* Comparison View */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Original Model */}
                  <div className="space-y-2">
                    <Label icon={<User className="size-3.5" />} text="原始模特" />
                    {modelImage && (
                      <div className="rounded-lg overflow-hidden border">
                        <img
                          src={`/api/images/${modelImage.url}`}
                          alt="原始模特"
                          className="w-full aspect-[3/4] object-cover"
                        />
                      </div>
                    )}
                  </div>

                  {/* Generated Result */}
                  <div className="space-y-2">
                    <Label icon={<Shirt className="size-3.5" />} text="换装结果" />
                    <div
                      className="rounded-lg overflow-hidden border-2 border-rose-200 relative group cursor-pointer"
                      onClick={() => setEnlargeUrl(currentResult.url)}
                    >
                      <img
                        src={`/api/images/${currentResult.url}`}
                        alt="生成结果"
                        className="w-full aspect-[3/4] object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <ZoomIn className="size-8 text-white opacity-0 group-hover:opacity-80 transition-opacity" />
                      </div>
                    </div>
                  </div>

                  {/* Garment Reference */}
                  <div className="space-y-2">
                    <Label icon={<Shirt className="size-3.5" />} text="服装参考" />
                    {garmentImage && (
                      <div className="rounded-lg overflow-hidden border">
                        <img
                          src={`/api/images/${garmentImage.url}`}
                          alt="服装参考"
                          className="w-full aspect-square object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Result Navigation */}
                {currentResults.length > 1 && (
                  <div className="flex items-center justify-center gap-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentResultIndex((prev) =>
                          prev > 0 ? prev - 1 : currentResults.length - 1
                        )
                      }
                    >
                      <ChevronLeft className="size-4" />
                    </Button>
                    <span className="text-sm text-gray-500">
                      {currentResultIndex + 1} / {currentResults.length}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentResultIndex((prev) =>
                          prev < currentResults.length - 1 ? prev + 1 : 0
                        )
                      }
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                )}

                {/* Thumbnails */}
                {currentResults.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {currentResults.map((result, idx) => (
                      <div
                        key={result.id}
                        onClick={() => setCurrentResultIndex(idx)}
                        className={`shrink-0 cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                          idx === currentResultIndex
                            ? 'border-rose-500 ring-1 ring-rose-200'
                            : 'border-transparent hover:border-rose-200'
                        }`}
                      >
                        <img
                          src={`/api/images/${result.url}`}
                          alt={`结果 ${idx + 1}`}
                          className="w-16 h-20 object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-400">
                <p className="text-sm">选择一个任务查看结果</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Enlarge Dialog */}
      <Dialog
        open={!!enlargeUrl}
        onOpenChange={(open) => !open && setEnlargeUrl(null)}
      >
        <DialogContent className="max-w-4xl p-2">
          {enlargeUrl && (
            <img
              src={`/api/images/${enlargeUrl}`}
              alt="放大查看"
              className="w-full h-auto rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Label({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <div className="flex items-center gap-1.5 text-sm text-gray-600">
      {icon}
      <span>{text}</span>
    </div>
  );
}
