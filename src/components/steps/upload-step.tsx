'use client';

import { useCallback, useMemo, useState } from 'react';
import { User, Shirt, Trash2, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ImageDropzone } from '@/components/image-dropzone';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore } from '@/lib/store';
import type { Project } from '@/lib/types';
import { GARMENT_CATEGORIES } from '@/lib/types';
import { toast } from 'sonner';

interface UploadStepProps {
  project: Project | null;
  onRefresh: () => void;
}

export function UploadStep({ project, onRefresh }: UploadStepProps) {
  const {
    selectedModelImageId,
    selectedGarmentImageId,
    setSelectedModelImageId,
    setSelectedGarmentImageId,
  } = useAppStore();

  const [uploadingModel, setUploadingModel] = useState(false);
  const [uploadingGarment, setUploadingGarment] = useState(false);

  const modelImages = useMemo(
    () => project?.modelImages ?? [],
    [project?.modelImages]
  );
  const garmentImages = useMemo(
    () => project?.garmentImages ?? [],
    [project?.garmentImages]
  );
  const loading = !project;

  const handleUploadModel = useCallback(
    async (files: File[]) => {
      if (!project) {
        toast.error('请先选择或创建项目');
        return;
      }
      setUploadingModel(true);
      let successCount = 0;
      for (const file of files) {
        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('projectId', project.id);
          const res = await fetch('/api/upload/model', {
            method: 'POST',
            body: formData,
          });
          if (res.ok) successCount++;
        } catch {
          // continue uploading other files
        }
      }
      setUploadingModel(false);
      if (successCount > 0) {
        toast.success(`成功上传 ${successCount} 张模特图片`);
        onRefresh();
      } else {
        toast.error('上传失败');
      }
    },
    [project, onRefresh]
  );

  const handleUploadGarment = useCallback(
    async (files: File[]) => {
      if (!project) {
        toast.error('请先选择或创建项目');
        return;
      }
      setUploadingGarment(true);
      let successCount = 0;
      for (const file of files) {
        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('projectId', project.id);
          const res = await fetch('/api/upload/garment', {
            method: 'POST',
            body: formData,
          });
          if (res.ok) successCount++;
        } catch {
          // continue uploading other files
        }
      }
      setUploadingGarment(false);
      if (successCount > 0) {
        toast.success(`成功上传 ${successCount} 张服装图片`);
        onRefresh();
      } else {
        toast.error('上传失败');
      }
    },
    [project, onRefresh]
  );

  const handleDeleteModel = useCallback(
    async (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        const res = await fetch(`/api/upload/model/${id}`, { method: 'DELETE' });
        if (res.ok) {
          toast.success('已删除模特图片');
          if (selectedModelImageId === id) setSelectedModelImageId(null);
          onRefresh();
        }
      } catch {
        toast.error('删除失败');
      }
    },
    [selectedModelImageId, setSelectedModelImageId, onRefresh]
  );

  const handleDeleteGarment = useCallback(
    async (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        const res = await fetch(`/api/upload/garment/${id}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          toast.success('已删除服装图片');
          if (selectedGarmentImageId === id) setSelectedGarmentImageId(null);
          onRefresh();
        }
      } catch {
        toast.error('删除失败');
      }
    },
    [selectedGarmentImageId, setSelectedGarmentImageId, onRefresh]
  );

  const getCategoryLabel = (value?: string) => {
    if (!value) return '';
    const cat = GARMENT_CATEGORIES.find((c) => c.value === value);
    return cat?.label ?? value;
  };

  if (!project) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <div className="text-center">
          <User className="size-12 mx-auto mb-3 opacity-30" />
          <p>请先选择或创建一个项目</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Model Images Panel */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="rounded-full bg-rose-100 p-1.5">
              <User className="size-4 text-rose-600" />
            </div>
            模特图片
            {selectedModelImageId && (
              <Badge className="bg-rose-500 text-white text-[10px] ml-auto">
                <CheckCircle2 className="size-3 mr-0.5" />
                已选择
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ImageDropzone
            onFilesSelected={handleUploadModel}
            disabled={uploadingModel}
            label={uploadingModel ? '上传中...' : '拖拽模特图片到此处或点击上传'}
          />

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[3/4] rounded-lg" />
              ))}
            </div>
          ) : modelImages.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <User className="size-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">暂无模特图片</p>
              <p className="text-xs mt-1">上传模特照片以开始换装</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
              {modelImages.map((img) => (
                <div
                  key={img.id}
                  onClick={() => setSelectedModelImageId(img.id)}
                  className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                    selectedModelImageId === img.id
                      ? 'border-rose-500 ring-2 ring-rose-200 shadow-md'
                      : 'border-transparent hover:border-rose-200'
                  }`}
                >
                  <img
                    src={`/api/images/${img.url}`}
                    alt={img.name}
                    className="w-full aspect-[3/4] object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => handleDeleteModel(img.id, e)}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                  {selectedModelImageId === img.id && (
                    <div className="absolute bottom-1 right-1">
                      <CheckCircle2 className="size-5 text-white drop-shadow-lg" />
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1.5">
                    <p className="text-[10px] text-white truncate">{img.name}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Garment Images Panel */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="rounded-full bg-amber-100 p-1.5">
              <Shirt className="size-4 text-amber-600" />
            </div>
            服装图片
            {selectedGarmentImageId && (
              <Badge className="bg-amber-500 text-white text-[10px] ml-auto">
                <CheckCircle2 className="size-3 mr-0.5" />
                已选择
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ImageDropzone
            onFilesSelected={handleUploadGarment}
            disabled={uploadingGarment}
            label={uploadingGarment ? '上传中...' : '拖拽服装图片到此处或点击上传'}
          />

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-lg" />
              ))}
            </div>
          ) : garmentImages.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Shirt className="size-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">暂无服装图片</p>
              <p className="text-xs mt-1">上传服装照片以进行换装</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
              {garmentImages.map((img) => (
                <div
                  key={img.id}
                  onClick={() => setSelectedGarmentImageId(img.id)}
                  className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                    selectedGarmentImageId === img.id
                      ? 'border-rose-500 ring-2 ring-rose-200 shadow-md'
                      : 'border-transparent hover:border-rose-200'
                  }`}
                >
                  <img
                    src={`/api/images/${img.url}`}
                    alt={img.name}
                    className="w-full aspect-square object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => handleDeleteGarment(img.id, e)}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                  {img.category && (
                    <Badge
                      className="absolute top-1 left-1 text-[10px]"
                      variant="secondary"
                    >
                      {getCategoryLabel(img.category)}
                    </Badge>
                  )}
                  {selectedGarmentImageId === img.id && (
                    <div className="absolute bottom-1 right-1">
                      <CheckCircle2 className="size-5 text-white drop-shadow-lg" />
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1.5">
                    <p className="text-[10px] text-white truncate">{img.name}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
