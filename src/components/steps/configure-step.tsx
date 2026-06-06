'use client';

import { useCallback, useEffect, useState } from 'react';
import { Settings, User, Shirt, ArrowRight, Cpu, Zap, Image as ImageIcon, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { useAppStore } from '@/lib/store';
import type { Project } from '@/lib/types';
import { Z_IMAGE_RESOLUTIONS } from '@/lib/types';
import { toast } from 'sonner';

interface ConfigureStepProps {
  project: Project | null;
  onStartGeneration: () => void;
}

export function ConfigureStep({ project, onStartGeneration }: ConfigureStepProps) {
  const {
    selectedModelImageId,
    selectedGarmentImageId,
    generationParams,
    setGenerationParams,
    zImageParams,
    setZImageParams,
    zImageOnline,
    setZImageOnline,
  } = useAppStore();

  const [starting, setStarting] = useState(false);

  const modelImage = project?.modelImages?.find(
    (img) => img.id === selectedModelImageId
  );
  const garmentImage = project?.garmentImages?.find(
    (img) => img.id === selectedGarmentImageId
  );

  const canGenerate = selectedModelImageId && selectedGarmentImageId;

  // Check Z-Image service health
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch('/api/z-image/generate', { method: 'GET' });
        if (res.ok) {
          const data = await res.json();
          setZImageOnline(data.status === 'online');
          setZImageMode(data.mode || 'unknown');
        } else {
          setZImageOnline(false);
          setZImageMode('unknown');
        }
      } catch {
        setZImageOnline(false);
        setZImageMode('unknown');
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, [setZImageOnline]);

  const handleStart = useCallback(async () => {
    if (!project || !canGenerate) return;
    setStarting(true);
    try {
      onStartGeneration();
    } finally {
      setStarting(false);
    }
  }, [project, canGenerate, onStartGeneration]);

  const isZImage = zImageParams.model === 'z-image';
  const [zImageMode, setZImageMode] = useState<string>('unknown');

  // Group resolutions
  const resolutionGroups = Z_IMAGE_RESOLUTIONS.reduce<Record<string, typeof Z_IMAGE_RESOLUTIONS[number][]>>((acc, res) => {
    const group = res.group || '其他';
    if (!acc[group]) acc[group] = [];
    acc[group].push(res);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Selected Images Preview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="rounded-full bg-rose-100 p-1.5">
              <Settings className="size-4 text-rose-600" />
            </div>
            已选素材预览
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Model Preview */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-sm">
                <User className="size-3.5" />
                模特图片
              </Label>
              {modelImage ? (
                <div className="relative rounded-lg overflow-hidden border-2 border-rose-200">
                  <img
                    src={`/api/images/${modelImage.url}`}
                    alt={modelImage.name}
                    className="w-full aspect-[3/4] object-cover"
                  />
                  <Badge className="absolute top-2 left-2 bg-rose-500 text-white">
                    已选择
                  </Badge>
                </div>
              ) : (
                <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-gray-200 aspect-[3/4] bg-gray-50">
                  <div className="text-center text-gray-400">
                    <User className="size-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">未选择模特</p>
                    <p className="text-xs">请返回上一步选择</p>
                  </div>
                </div>
              )}
            </div>

            {/* Garment Preview */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-sm">
                <Shirt className="size-3.5" />
                服装图片
              </Label>
              {garmentImage ? (
                <div className="relative rounded-lg overflow-hidden border-2 border-amber-200">
                  <img
                    src={`/api/images/${garmentImage.url}`}
                    alt={garmentImage.name}
                    className="w-full aspect-square object-cover"
                  />
                  <Badge className="absolute top-2 left-2 bg-amber-500 text-white">
                    已选择
                  </Badge>
                </div>
              ) : (
                <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-gray-200 aspect-square bg-gray-50">
                  <div className="text-center text-gray-400">
                    <Shirt className="size-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">未选择服装</p>
                    <p className="text-xs">请返回上一步选择</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Arrow indicator */}
          <div className="hidden sm:flex items-center justify-center my-4">
            <div className="flex items-center gap-2 text-rose-400">
              <User className="size-5" />
              <span className="text-sm">+</span>
              <Shirt className="size-5" />
              <ArrowRight className="size-5" />
              <span className="text-sm font-medium text-rose-500">
                {isZImage ? 'Z-Image 造相' : 'AI 换装结果'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Model Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="rounded-full bg-violet-100 p-1.5">
              <Cpu className="size-4 text-violet-600" />
            </div>
            生图模型选择
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Z-Image Model (Primary) */}
            <button
              onClick={() => setZImageParams({ model: 'z-image' })}
              className={`relative text-left p-4 rounded-xl border-2 transition-all ${
                isZImage
                  ? 'border-violet-500 bg-violet-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-violet-200 hover:bg-violet-50/50'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`rounded-lg p-2 ${isZImage ? 'bg-violet-500' : 'bg-gray-100'}`}>
                  <Zap className={`size-4 ${isZImage ? 'text-white' : 'text-gray-500'}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">Z-Image 造相</span>
                    <Badge className="text-[10px] bg-violet-100 text-violet-700 border-violet-200">
                      默认
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500">通义MAI · 6B参数 · ModelScope/HuggingFace</p>
                </div>
                {isZImage && (
                  <CheckCircle2 className="size-5 text-violet-500" />
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  {zImageOnline ? (
                    <><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> 在线</>
                  ) : (
                    <><span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> 离线</>
                  )}
                </span>
                {zImageOnline && zImageMode !== 'unknown' && (
                  <>
                    <span>·</span>
                    <span className="text-violet-500">
                      {zImageMode === 'modelscope' && 'ModelScope'}
                      {zImageMode === 'remote' && 'HF Space'}
                      {zImageMode === 'api' && 'HF API'}
                      {zImageMode === 'local' && '本地GPU'}
                      {zImageMode === 'fallback' && '自动回退'}
                    </span>
                  </>
                )}
                <span>·</span>
                <span>支持负提示词</span>
                <span>·</span>
                <span>多分辨率</span>
                <span>·</span>
                <span>CFG引导</span>
              </div>
              {!zImageOnline && isZImage && (
                <p className="mt-2 text-xs text-amber-600 bg-amber-50 rounded p-2">
                  Z-Image 服务当前离线，生成时将自动回退到备选模型。请确保 z-image-service 已启动。
                </p>
              )}
            </button>

            {/* Default Model (Fallback) */}
            <button
              onClick={() => setZImageParams({ model: 'default' })}
              className={`relative text-left p-4 rounded-xl border-2 transition-all ${
                !isZImage
                  ? 'border-gray-400 bg-gray-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`rounded-lg p-2 ${!isZImage ? 'bg-gray-500' : 'bg-gray-100'}`}>
                  <ImageIcon className={`size-4 ${!isZImage ? 'text-white' : 'text-gray-500'}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">备选 AI 模型</span>
                    <Badge className="text-[10px] bg-gray-100 text-gray-500 border-gray-200">
                      回退
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500">内置 AI 图像生成（始终可用）</p>
                </div>
                {!isZImage && (
                  <CheckCircle2 className="size-5 text-gray-500" />
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span>快速生成</span>
                <span>·</span>
                <span>始终在线</span>
                <span>·</span>
                <span>无需额外服务</span>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Z-Image Model Parameters */}
      {isZImage && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="rounded-full bg-violet-100 p-1.5">
                <Zap className="size-4 text-violet-600" />
              </div>
              Z-Image 模型参数
              <Badge className="text-[10px] bg-violet-100 text-violet-700 border-violet-200 ml-1">
                ModelScope/HF
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Resolution */}
            <div className="space-y-3">
              <Label className="text-sm">输出分辨率</Label>
              <Select
                value={zImageParams.resolution}
                onValueChange={(val) => setZImageParams({ resolution: val })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择分辨率" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(resolutionGroups).map(([group, resolutions]) => (
                    <div key={group}>
                      <Label className="px-2 py-1.5 text-xs text-gray-400 font-semibold">{group}</Label>
                      {resolutions.map((res) => (
                        <SelectItem key={res.value} value={res.value}>
                          {res.label}
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-400">
                推荐竖屏分辨率(3:4 / 9:16)用于模特展示
              </p>
            </div>

            <Separator />

            {/* Inference Steps */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm">推理步数</Label>
                <span className="text-sm font-mono text-violet-500 bg-violet-50 px-2 py-0.5 rounded">
                  {zImageParams.numInferenceSteps}
                </span>
              </div>
              <Slider
                value={[zImageParams.numInferenceSteps]}
                min={10}
                max={50}
                step={1}
                onValueChange={([val]) =>
                  setZImageParams({ numInferenceSteps: val })
                }
                className="[&_[data-slot=slider-range]]:bg-violet-500 [&_[data-slot=slider-thumb]]:border-violet-500"
              />
              <p className="text-xs text-gray-400">
                28-50步推荐，步数越多质量越高但速度越慢
              </p>
            </div>

            <Separator />

            {/* Guidance Scale */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm">引导比例 (CFG)</Label>
                <span className="text-sm font-mono text-violet-500 bg-violet-50 px-2 py-0.5 rounded">
                  {zImageParams.guidanceScale.toFixed(1)}
                </span>
              </div>
              <Slider
                value={[zImageParams.guidanceScale]}
                min={1}
                max={10}
                step={0.5}
                onValueChange={([val]) =>
                  setZImageParams({ guidanceScale: val })
                }
                className="[&_[data-slot=slider-range]]:bg-violet-500 [&_[data-slot=slider-thumb]]:border-violet-500"
              />
              <p className="text-xs text-gray-400">
                3.0-5.0推荐，数值越高越严格遵循提示词
              </p>
            </div>

            <Separator />

            {/* CFG Normalization */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm">CFG 归一化</Label>
                <p className="text-xs text-gray-400">开启后可能提升细节表现</p>
              </div>
              <Switch
                checked={zImageParams.cfgNormalization}
                onCheckedChange={(checked) =>
                  setZImageParams({ cfgNormalization: checked })
                }
              />
            </div>

            <Separator />

            {/* Seed Settings */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm">随机种子</Label>
                  <p className="text-xs text-gray-400">关闭后可固定种子复现结果</p>
                </div>
                <Switch
                  checked={zImageParams.randomSeed}
                  onCheckedChange={(checked) =>
                    setZImageParams({ randomSeed: checked })
                  }
                />
              </div>
              {!zImageParams.randomSeed && (
                <div className="flex items-center gap-3">
                  <Label className="text-sm shrink-0">种子值</Label>
                  <Input
                    type="number"
                    value={zImageParams.seed}
                    onChange={(e) =>
                      setZImageParams({ seed: parseInt(e.target.value) || 0 })
                    }
                    className="font-mono"
                    placeholder="42"
                  />
                </div>
              )}
            </div>

            <Separator />

            {/* Negative Prompt */}
            <div className="space-y-3">
              <Label className="text-sm">负提示词（可选）</Label>
              <Textarea
                placeholder="例如：低质量、模糊、变形、多余手指..."
                value={zImageParams.negativePrompt}
                onChange={(e) =>
                  setZImageParams({ negativePrompt: e.target.value })
                }
                rows={2}
              />
              <p className="text-xs text-gray-400">
                Z-Image 对负提示词响应灵敏，可有效抑制不需要的元素
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* General Parameter Configuration */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">通用生成参数</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Garment Strength */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm">服装保持强度</Label>
              <span className="text-sm font-mono text-rose-500 bg-rose-50 px-2 py-0.5 rounded">
                {generationParams.garmentStrength}
              </span>
            </div>
            <Slider
              value={[generationParams.garmentStrength]}
              min={0}
              max={100}
              step={1}
              onValueChange={([val]) =>
                setGenerationParams({ garmentStrength: val })
              }
              className="[&_[data-slot=slider-range]]:bg-rose-500 [&_[data-slot=slider-thumb]]:border-rose-500"
            />
            <p className="text-xs text-gray-400">
              数值越高，生成结果越贴合原始服装样式
            </p>
          </div>

          <Separator />

          {/* Pose Following */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm">姿势跟随度</Label>
              <span className="text-sm font-mono text-rose-500 bg-rose-50 px-2 py-0.5 rounded">
                {generationParams.poseFollow}
              </span>
            </div>
            <Slider
              value={[generationParams.poseFollow]}
              min={0}
              max={100}
              step={1}
              onValueChange={([val]) =>
                setGenerationParams({ poseFollow: val })
              }
              className="[&_[data-slot=slider-range]]:bg-rose-500 [&_[data-slot=slider-thumb]]:border-rose-500"
            />
            <p className="text-xs text-gray-400">
              数值越高，越严格地遵循所选姿势模板
            </p>
          </div>

          <Separator />

          {/* Face Consistency */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm">人脸一致性</Label>
              <span className="text-sm font-mono text-rose-500 bg-rose-50 px-2 py-0.5 rounded">
                {generationParams.faceConsistency}
              </span>
            </div>
            <Slider
              value={[generationParams.faceConsistency]}
              min={0}
              max={100}
              step={1}
              onValueChange={([val]) =>
                setGenerationParams({ faceConsistency: val })
              }
              className="[&_[data-slot=slider-range]]:bg-rose-500 [&_[data-slot=slider-thumb]]:border-rose-500"
            />
            <p className="text-xs text-gray-400">
              数值越高，生成结果与原始模特人脸越一致
            </p>
          </div>

          <Separator />

          {/* Batch Size */}
          <div className="space-y-3">
            <Label className="text-sm">生成数量</Label>
            <RadioGroup
              value={String(generationParams.batchSize)}
              onValueChange={(val) =>
                setGenerationParams({ batchSize: Number(val) })
              }
              className="flex gap-3"
            >
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="flex items-center gap-1.5">
                  <RadioGroupItem
                    value={String(n)}
                    id={`batch-${n}`}
                    className="data-[state=checked]:border-rose-500 [&>svg]:fill-rose-500"
                  />
                  <Label htmlFor={`batch-${n}`} className="text-sm cursor-pointer">
                    {n} 张
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <Separator />

          {/* Custom Prompt */}
          <div className="space-y-3">
            <Label className="text-sm">自定义提示词（可选）</Label>
            <Textarea
              placeholder="例如：高分辨率、专业摄影棚、自然光线..."
              value={generationParams.prompt}
              onChange={(e) =>
                setGenerationParams({ prompt: e.target.value })
              }
              rows={3}
            />
            <p className="text-xs text-gray-400">
              添加额外的生成提示词以微调结果风格
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Start Generation Button */}
      <Button
        onClick={handleStart}
        disabled={!canGenerate || starting}
        className="w-full h-12 text-base bg-rose-500 hover:bg-rose-600 text-white disabled:opacity-50"
      >
        {starting ? '准备中...' : `使用 ${isZImage ? 'Z-Image 造相' : '默认模型'} 开始生成`}
      </Button>

      {!canGenerate && (
        <p className="text-center text-sm text-gray-400">
          请先在上传步骤中选择模特和服装图片
        </p>
      )}
    </div>
  );
}
