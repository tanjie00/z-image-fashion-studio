'use client';

import { useCallback, useEffect, useState } from 'react';
import { Download, CheckCircle2, FileImage } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import type { GenerationTask, Project } from '@/lib/types';

interface ExportStepProps {
  project: Project | null;
}

interface ExportItem {
  taskId: string;
  resultId: string;
  url: string;
  taskCreatedAt: string;
}

export function ExportStep({ project }: ExportStepProps) {
  const [items, setItems] = useState<ExportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [downloading, setDownloading] = useState(false);

  const fetchCompletedTasks = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (project) params.set('projectId', project.id);
      const res = await fetch(`/api/generate?${params.toString()}`);
      if (res.ok) {
        const data: GenerationTask[] = await res.json();
        const completed = data.filter((t) => t.status === 'completed');
        const exportItems: ExportItem[] = [];
        for (const task of completed) {
          for (const result of task.results) {
            exportItems.push({
              taskId: task.id,
              resultId: result.id,
              url: result.url,
              taskCreatedAt: task.createdAt,
            });
          }
        }
        setItems(exportItems);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [project]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    fetchCompletedTasks();
  }, [fetchCompletedTasks]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((i) => i.resultId)));
    }
  }, [selectedIds.size, items]);

  const handleDownload = useCallback(
    async (url: string) => {
      try {
        const response = await fetch(`/api/images/${url}`);
        const blob = await response.blob();
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        const filename = url.split('/').pop() ?? 'image.png';
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
      } catch {
        // Fallback: open in new tab
        window.open(`/api/images/${url}`, '_blank');
      }
    },
    []
  );

  const handleDownloadSelected = useCallback(async () => {
    if (selectedIds.size === 0) return;
    setDownloading(true);
    const selectedItems = items.filter((i) => selectedIds.has(i.resultId));
    for (const item of selectedItems) {
      await handleDownload(item.url);
      // Small delay between downloads
      await new Promise((r) => setTimeout(r, 500));
    }
    setDownloading(false);
  }, [selectedIds, items, handleDownload]);

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <Download className="size-12 mx-auto mb-3 opacity-20" />
        <p className="text-sm">暂无可导出的结果</p>
        <p className="text-xs mt-1">请先完成图片生成步骤</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-rose-100 p-1.5">
            <Download className="size-4 text-rose-600" />
          </div>
          <h2 className="text-lg font-semibold">导出下载</h2>
          <Badge variant="secondary">{items.length} 张结果</Badge>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleSelectAll}
            className="gap-1.5"
          >
            <CheckCircle2 className="size-3.5" />
            {selectedIds.size === items.length ? '取消全选' : '全选'}
          </Button>
          <Button
            size="sm"
            onClick={handleDownloadSelected}
            disabled={selectedIds.size === 0 || downloading}
            className="bg-rose-500 hover:bg-rose-600 text-white gap-1.5"
          >
            <Download className="size-3.5" />
            {downloading
              ? '下载中...'
              : `下载选中 (${selectedIds.size})`}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">生成结果列表</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {items.map((item) => {
              const isSelected = selectedIds.has(item.resultId);
              return (
                <div
                  key={item.resultId}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                    isSelected
                      ? 'border-rose-300 bg-rose-50'
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleSelect(item.resultId)}
                  />
                  <div className="shrink-0">
                    <img
                      src={`/api/images/${item.url}`}
                      alt="结果"
                      className="w-14 h-18 rounded-md object-cover border"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <FileImage className="size-3.5 text-gray-400" />
                      <span className="text-sm truncate">
                        {item.url.split('/').pop()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      生成于{' '}
                      {new Date(item.taskCreatedAt).toLocaleString('zh-CN')}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(item.url)}
                    className="shrink-0 gap-1"
                  >
                    <Download className="size-3.5" />
                    下载
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
