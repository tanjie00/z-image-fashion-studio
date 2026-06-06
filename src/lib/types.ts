export interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  modelImages: ModelImage[];
  garmentImages: GarmentImage[];
  generationTasks: GenerationTask[];
  _count?: {
    modelImages: number;
    garmentImages: number;
    generationTasks: number;
  };
}

export interface ModelImage {
  id: string;
  projectId: string;
  url: string;
  name: string;
  width?: number;
  height?: number;
  createdAt: string;
}

export interface GarmentImage {
  id: string;
  projectId: string;
  url: string;
  name: string;
  width?: number;
  height?: number;
  category?: string;
  createdAt: string;
}

export interface PoseTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  thumbnail?: string;
  poseData?: string;
  isDefault: boolean;
  createdAt: string;
}

export interface GenerationTask {
  id: string;
  projectId: string;
  modelImageId: string;
  garmentImageId: string;
  poseTemplateId?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  prompt?: string;
  params: string;
  createdAt: string;
  updatedAt: string;
  results: GenerationResult[];
}

export interface GenerationResult {
  id: string;
  taskId: string;
  url: string;
  width?: number;
  height?: number;
  createdAt: string;
}

export interface GenerationParams {
  garmentStrength: number;
  poseFollow: number;
  faceConsistency: number;
  batchSize: number;
  prompt: string;
}

/** Z-Image model specific parameters */
export interface ZImageParams {
  /** Model selection: 'z-image' or 'default' */
  model: 'z-image' | 'default';
  /** Resolution string for Z-Image (e.g., '864x1152 ( 3:4 )') */
  resolution: string;
  /** Number of inference steps (28-50 recommended) */
  numInferenceSteps: number;
  /** Guidance scale (3.0-5.0 recommended) */
  guidanceScale: number;
  /** CFG normalization */
  cfgNormalization: boolean;
  /** Whether to use random seed */
  randomSeed: boolean;
  /** Fixed seed value (when randomSeed is false) */
  seed: number;
  /** Negative prompt */
  negativePrompt: string;
}

export const STEP_LABELS = [
  { label: '上传素材', icon: 'Upload' },
  { label: '选择姿势', icon: 'PersonStanding' },
  { label: '参数配置', icon: 'Settings' },
  { label: '生成图片', icon: 'Wand2' },
  { label: '结果预览', icon: 'Eye' },
  { label: '导出下载', icon: 'Download' },
] as const;

export const GARMENT_CATEGORIES = [
  { value: 'top', label: '上装' },
  { value: 'bottom', label: '下装' },
  { value: 'dress', label: '连衣裙' },
  { value: 'outerwear', label: '外套' },
  { value: 'accessory', label: '配饰' },
] as const;

export const POSE_CATEGORIES = [
  { value: 'all', label: '全部' },
  { value: 'standing', label: '站立' },
  { value: 'fashion', label: '时尚' },
  { value: 'dynamic', label: '动态' },
  { value: 'sitting', label: '坐姿' },
  { value: 'children', label: '儿童' },
] as const;

/** Z-Image resolution options */
export const Z_IMAGE_RESOLUTIONS = [
  // 竖屏 - 模特展示首选
  { value: "864x1152 ( 3:4 )", label: "864x1152 (3:4 竖屏)", group: "竖屏推荐" },
  { value: "576x800 ( 3:4 )", label: "576x800 (3:4 竖屏)", group: "竖屏推荐" },
  { value: "1104x1472 ( 3:4 )", label: "1104x1472 (3:4 竖屏)", group: "竖屏推荐" },
  { value: "512x896 ( 9:16 )", label: "512x896 (9:16 竖屏)", group: "竖屏" },
  { value: "720x1280 ( 9:16 )", label: "720x1280 (9:16 竖屏)", group: "竖屏" },
  { value: "864x1536 ( 9:16 )", label: "864x1536 (9:16 竖屏)", group: "竖屏" },
  { value: "544x832 ( 2:3 )", label: "544x832 (2:3 竖屏)", group: "竖屏" },
  { value: "832x1248 ( 2:3 )", label: "832x1248 (2:3 竖屏)", group: "竖屏" },
  { value: "1024x1536 ( 2:3 )", label: "1024x1536 (2:3 竖屏)", group: "竖屏" },
  { value: "896x1152 ( 7:9 )", label: "896x1152 (7:9 竖屏)", group: "竖屏" },
  { value: "1120x1440 ( 7:9 )", label: "1120x1440 (7:9 竖屏)", group: "竖屏" },
  { value: "576x1344 ( 9:21 )", label: "576x1344 (9:21 长竖屏)", group: "竖屏" },
  // 标准
  { value: "720x720 ( 1:1 )", label: "720x720 (1:1)", group: "标准" },
  { value: "1024x1024 ( 1:1 )", label: "1024x1024 (1:1)", group: "标准" },
  { value: "1280x1280 ( 1:1 )", label: "1280x1280 (1:1)", group: "标准" },
  // 横屏
  { value: "896x512 ( 16:9 )", label: "896x512 (16:9 横屏)", group: "横屏" },
  { value: "1280x720 ( 16:9 )", label: "1280x720 (16:9 横屏)", group: "横屏" },
  { value: "1536x864 ( 16:9 )", label: "1536x864 (16:9 横屏)", group: "横屏" },
  { value: "1152x864 ( 4:3 )", label: "1152x864 (4:3)", group: "横屏" },
  { value: "832x544 ( 3:2 )", label: "832x544 (3:2)", group: "横屏" },
  { value: "1248x832 ( 3:2 )", label: "1248x832 (3:2)", group: "横屏" },
  { value: "1536x1024 ( 3:2 )", label: "1536x1024 (3:2)", group: "横屏" },
  { value: "1344x576 ( 21:9 )", label: "1344x576 (21:9 宽屏)", group: "横屏" },
] as const;
