'use client';

import { useCallback, useEffect, useState } from 'react';
import { FolderOpen, Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppStore } from '@/lib/store';
import type { Project } from '@/lib/types';
import { toast } from 'sonner';

interface ProjectSelectorProps {
  onProjectChange?: (project: Project) => void;
}

export function ProjectSelector({ onProjectChange }: ProjectSelectorProps) {
  const { currentProjectId, setCurrentProjectId } = useAppStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const currentProject = projects.find((p) => p.id === currentProjectId);

  const handleCreate = useCallback(async () => {
    if (!newName.trim()) {
      toast.error('请输入项目名称');
      return;
    }
    setCreating(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), description: newDesc.trim() || undefined }),
      });
      if (res.ok) {
        const project = await res.json();
        await fetchProjects();
        setCurrentProjectId(project.id);
        onProjectChange?.(project);
        setNewName('');
        setNewDesc('');
        toast.success('项目创建成功');
      } else {
        toast.error('创建项目失败');
      }
    } catch {
      toast.error('创建项目失败');
    } finally {
      setCreating(false);
    }
  }, [newName, newDesc, fetchProjects, setCurrentProjectId, onProjectChange]);

  const handleSelect = useCallback(
    (project: Project) => {
      setCurrentProjectId(project.id);
      onProjectChange?.(project);
      setOpen(false);
    },
    [setCurrentProjectId, onProjectChange]
  );

  const handleDelete = useCallback(
    async (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!confirm('确定要删除此项目吗？此操作不可撤销。')) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
        if (res.ok) {
          // If deleting current project, clear selection first to avoid re-render loop
          const cid = useAppStore.getState().currentProjectId;
          if (cid === id) {
            setCurrentProjectId(null);
          }
          await fetchProjects();
          toast.success('项目已删除');
        }
      } catch {
        toast.error('删除项目失败');
      } finally {
        setLoading(false);
      }
    },
    [fetchProjects, setCurrentProjectId]
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <FolderOpen className="size-4" />
          {currentProject ? (
            <span className="max-w-[120px] truncate">{currentProject.name}</span>
          ) : (
            '选择项目'
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>项目管理</DialogTitle>
          <DialogDescription>选择或创建一个项目来开始工作</DialogDescription>
        </DialogHeader>

        {/* Create new project */}
        <div className="space-y-3 rounded-lg border p-4 bg-gray-50/50">
          <Label className="text-sm font-medium">新建项目</Label>
          <Input
            placeholder="项目名称"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <Textarea
            placeholder="项目描述（可选）"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            rows={2}
          />
          <Button
            onClick={handleCreate}
            disabled={creating || !newName.trim()}
            className="w-full bg-rose-500 hover:bg-rose-600 text-white"
          >
            <Plus className="size-4 mr-1" />
            {creating ? '创建中...' : '创建项目'}
          </Button>
        </div>

        {/* Existing projects */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">已有项目</Label>
          <ScrollArea className="max-h-60">
            {projects.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-sm">
                暂无项目，请先创建一个
              </div>
            ) : (
              <div className="space-y-1.5">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    onClick={() => handleSelect(project)}
                    className="flex items-center justify-between rounded-lg border px-3 py-2.5 cursor-pointer transition-colors hover:bg-rose-50 hover:border-rose-200"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">
                          {project.name}
                        </span>
                        {project.id === currentProjectId && (
                          <Badge className="bg-rose-500 text-white text-[10px] px-1.5 py-0">
                            <Check className="size-3" />
                            当前
                          </Badge>
                        )}
                      </div>
                      {project.description && (
                        <p className="text-xs text-gray-400 truncate mt-0.5">
                          {project.description}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-2 text-gray-400 hover:text-destructive h-7 w-7 p-0"
                      onClick={(e) => handleDelete(project.id, e)}
                      disabled={loading}
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
