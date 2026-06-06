'use client';

import { useCallback, useEffect, useState } from 'react';
import { PersonStanding, Sparkles, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore } from '@/lib/store';
import type { PoseTemplate } from '@/lib/types';
import { POSE_CATEGORIES } from '@/lib/types';
import { toast } from 'sonner';

const CATEGORY_COLORS: Record<string, string> = {
  standing: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  fashion: 'bg-rose-50 text-rose-600 border-rose-200',
  dynamic: 'bg-purple-50 text-purple-600 border-purple-200',
  sitting: 'bg-amber-50 text-amber-600 border-amber-200',
  children: 'bg-sky-50 text-sky-600 border-sky-200',
};

export function PoseStep() {
  const { selectedPoseId, setSelectedPoseId } = useAppStore();
  const [poses, setPoses] = useState<PoseTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');

  const fetchPoses = useCallback(async () => {
    try {
      const res = await fetch('/api/poses');
      if (res.ok) {
        const data = await res.json();
        setPoses(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPoses();
  }, [fetchPoses]);

  const handleSeed = useCallback(async () => {
    setSeeding(true);
    try {
      const res = await fetch('/api/poses/seed', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        toast.success(`已加载 ${data.created} 个姿势模板`);
        fetchPoses();
      } else {
        toast.error('加载姿势模板失败');
      }
    } catch {
      toast.error('加载姿势模板失败');
    } finally {
      setSeeding(false);
    }
  }, [fetchPoses]);

  const filteredPoses =
    activeCategory === 'all'
      ? poses
      : poses.filter((p) => p.category === activeCategory);

  const getCategoryLabel = (value: string) => {
    const cat = POSE_CATEGORIES.find((c) => c.value === value);
    return cat?.label ?? value;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-9 w-40" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-rose-100 p-1.5">
            <PersonStanding className="size-4 text-rose-600" />
          </div>
          <h2 className="text-lg font-semibold">选择姿势模板</h2>
          <Badge variant="secondary" className="text-xs">
            {poses.length} 个姿势
          </Badge>
        </div>
        {poses.length === 0 && (
          <Button
            onClick={handleSeed}
            disabled={seeding}
            className="bg-rose-500 hover:bg-rose-600 text-white gap-1.5"
          >
            <Sparkles className="size-4" />
            {seeding ? '加载中...' : '加载姿势模板'}
          </Button>
        )}
        {poses.length > 0 && (
          <Button
            onClick={handleSeed}
            disabled={seeding}
            variant="outline"
            size="sm"
            className="gap-1.5"
          >
            <Sparkles className="size-3.5" />
            {seeding ? '重新加载...' : '重新加载'}
          </Button>
        )}
      </div>

      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="flex-wrap h-auto gap-1">
          {POSE_CATEGORIES.map((cat) => {
            const count =
              cat.value === 'all'
                ? poses.length
                : poses.filter((p) => p.category === cat.value).length;
            return (
              <TabsTrigger key={cat.value} value={cat.value} className="text-xs gap-1">
                {cat.label}
                <span className="text-[10px] text-gray-400">({count})</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {POSE_CATEGORIES.map((cat) => (
          <TabsContent key={cat.value} value={cat.value}>
            {filteredPoses.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <PersonStanding className="size-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">暂无姿势模板</p>
                <p className="text-xs mt-1">点击上方按钮加载姿势模板</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {filteredPoses.map((pose) => {
                  const isSelected = selectedPoseId === pose.id;
                  const hasThumbnail = !!pose.thumbnail;
                  return (
                    <Card
                      key={pose.id}
                      onClick={() => setSelectedPoseId(pose.id)}
                      className={`cursor-pointer transition-all hover:shadow-md overflow-hidden py-0 gap-0 ${
                        isSelected
                          ? 'ring-2 ring-rose-500 border-rose-500 shadow-md'
                          : 'hover:border-rose-200'
                      }`}
                    >
                      {/* Thumbnail image or fallback gradient */}
                      <div className="relative h-36 bg-gray-100 flex items-center justify-center overflow-hidden">
                        {hasThumbnail ? (
                          <img
                            src={`/api/images/${pose.thumbnail}`}
                            alt={pose.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <PersonStanding className="size-12 text-gray-300" />
                        )}
                        {/* Selected checkmark */}
                        {isSelected && (
                          <div className="absolute top-2 right-2 bg-rose-500 rounded-full p-0.5 shadow-sm">
                            <Check className="size-3.5 text-white" />
                          </div>
                        )}
                        {/* Category badge */}
                        <div className="absolute bottom-2 left-2">
                          <Badge
                            className={`text-[10px] border ${
                              CATEGORY_COLORS[pose.category] ??
                              'bg-gray-50 text-gray-600 border-gray-200'
                            }`}
                          >
                            {getCategoryLabel(pose.category)}
                          </Badge>
                        </div>
                      </div>
                      <CardContent className="p-2.5">
                        <p className="font-medium text-sm truncate leading-tight">
                          {pose.category === 'children' && pose.name.startsWith('儿童')
                            ? pose.name.slice(2)
                            : pose.name}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
