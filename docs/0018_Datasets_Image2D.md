---
Title | Datasets Image2D
-- | --
Created @ | `2021-09-08T06:25:00Z`
Updated @| `2026-11-11T09:37:35Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/18)

---
# 图像数据集

2D 图像数据集按**任务**分类最清晰。本文是总入口：按任务列出常用数据集、简单描述和规模统计，并链接到本站已有的专题文章。3D 数据集见 [Datasets 3D](0087_Datasets_Image3D)，其他模态见 [Datasets Video](0019_Datasets_Video)、[Datasets Audio](0020_Datasets_Audio)、[Datasets NLP](0021_Datasets_NLP)。

> 规模数字说明：多数来自对应论文摘要或官网；标"（待核实）"的是凭记忆给出、未逐项核对的数字，使用前请以官方页面为准。同一数据集不同版本、不同划分的统计可能不同。

## 专题导航

- [Classification 分类](0028_Datasets_Image2D_Classification)
- [Object Detection/Recognition 检测](0237_Datasets_Image2D_Detection)
  - [Edge Detection 边缘检测](0098_Datasets_Image2D_EdgeDetection)
  - [Face Detection/Recognition 人脸](0238_Datasets_Image2D_Face)
  - [Text Detection/Recognition 文字 OCR](0240_Datasets_Image2D_OCR)
- [Segmentation 分割](0097_Datasets_Image2D_Segmentation)
- [Object Counting/Crowd Counting 计数](0239_Datasets_Image2D_OC)
- [KeyPoint 关键点/姿态](0248_Datasets_Image2D_KeyPoint)
- [Retrieval 检索](0241_Datasets_Image2D_Retrieval)
- [AutoML 基准](0244_Datasets_Image2D_AutoML)
- [Defect 缺陷/异常检测](0245_Datasets_Image2D_Defect)

## 总览

任务 | 常用数据集
-- | --
分类 | MNIST、CIFAR-10/100、ImageNet、Places、iNaturalist、Oxford-IIIT Pets
检测 | PASCAL VOC、MS COCO、Open Images、Objects365、LVIS
分割 | COCO、PASCAL VOC、Cityscapes、ADE20K、CamVid、LVIS、SA-1B
边缘检测 | BSDS500、NYUDv2、Multi-cue
人脸 | LFW、CelebA、WIDER FACE、VGGFace2
文字 OCR | ICDAR 系列、Total-Text、SynthText、MJSynth
计数 | ShanghaiTech、UCF-QNRF、NWPU-Crowd、SKU-110K、CARPK
关键点/姿态 | COCO Keypoints、MPII、Human3.6M
检索 | Oxford5k/Paris6k、Holidays、UKBench、DeepFashion、Stanford Online Products、GLDv2
AutoML | NAS-Bench-101、NAS-Bench-201、NDS
缺陷/异常检测 | MVTec AD、VisA、MPDD、NEU-DET、KolektorSDD、DAGM

## 一、图像分类

数据集 | 描述 | 简单统计
-- | -- | --
[MNIST](0030_Datasets_Image2D_Classification_mnist) | 手写数字灰度图，入门级基准 | 7 万张 28×28 图像、10 类（6 万训练 / 1 万测试）
[Fashion-MNIST](https://github.com/zalandoresearch/fashion-mnist) | 替代 MNIST 的服饰灰度图 | 7 万张 28×28 图像、10 类，每类 7,000 张；6 万训练 / 1 万测试
[CIFAR-10/100](0032_Datasets_Image2D_Classification_Cifar) | 小尺寸彩色图像 | 6 万张 32×32 彩色图；CIFAR-10 为 10 类，CIFAR-100 为 100 类（待核实）
[ImageNet](0031_Datasets_Image2D_Classification_ImageNet) | 大规模分类基准，ILSVRC 竞赛使用其 1000 类子集 | ILSVRC 约 128 万训练图、5 万验证图、1000 类（待核实）；完整版 ImageNet-21k 约 1,400 万张（待核实）
[Places](http://places2.csail.mit.edu/) | 场景分类 | 论文称约 1,000 万张场景图像
[iNaturalist](https://github.com/visipedia/inat_comp) | 细粒度物种分类与检测，长尾分布 | 2017 版：约 85.9 万张图像、5,000+ 个物种
[Oxford-IIIT Pets](0029_Datasets_Image2D_Classification_Pets) | 宠物细粒度分类，含分割标注 | 37 类、约 7,400 张图像（待核实）
[DTD](0481_Datasets_Image2D_DTD) | 纹理描述数据集（47 类纹理） | 见专文

## 二、目标检测

数据集 | 描述 | 简单统计
-- | -- | --
[PASCAL VOC](0092_Datasets_Image2D_PascalVOC) | 经典检测/分割基准，2005–2012 年挑战赛 | 20 类；VOC2007 / VOC2012 常合用（待核实具体张数）
[MS COCO](0247_Datasets_Image2D_COCO) | 日常场景检测/分割/关键点/字幕，当前最通用的检测基准 | 论文称 328k 张图像、250 万个标注实例；80 类物体（待核实）
[Open Images V4](https://storage.googleapis.com/openimages/web/index.html) | 谷歌大规模数据集，分类 + 检测 + 视觉关系 | 920 万张图像；3,010 万图像级标签；1,540 万个框、600 类；37.5 万视觉关系
[Objects365](https://www.objects365.org/) | 大规模检测预训练数据 | 365 类；规模随版本变化（待核实）
[BIT-Vehicle](0246_Datasets_Image2D_Detection_BITVehicle) | 车辆检测与车型分类 | 见专文
[CPPE-5](0489_Datasets_Image2D_Detection_CPPE5) | 个人防护装备检测 | 见专文
[UA-DETRAC](http://detrac-db.rit.albany.edu/) | 交通监控车辆检测与跟踪 | （待核实）

标注格式与转换见 [BBox](0488_Datasets_Image2D_Detection_BBox)。

## 三、图像分割

数据集 | 描述 | 简单统计
-- | -- | --
[Cityscapes](0093_Datasets_Image2D_Segmentation_Cityscapes) | 城市街景语义/实例分割 | 5,000 张精细标注 + 约 2 万张粗标注，约 50 个城市（待核实）
[CamVid](0088_Datasets_Image2D_Segmentation_CamVid) | 早期驾驶场景分割 | 约 701 张标注图像（待核实）
[ADE20K](http://groups.csail.mit.edu/vision/datasets/ADE20K/) | 场景解析，对象和部件标注 | 常用的 SceneParsing 基准为 150 类、约 2 万张训练图（待核实）
[LVIS](0094_Datasets_Image2D_Segmentation_LVIS) | 大词表长尾实例分割 | 计划 164k 张图像、约 200 万个掩码、1000+ 类
[SA-1B](https://segment-anything.com/dataset/index.html) | Segment Anything 的训练数据 | 1,100 万张图像、超过 10 亿个掩码
[TACO](0089_Datasets_Image2D_Segmentation_TACO) | 垃圾分割 | 见专文
[Balloon](0090_Datasets_Image2D_Segmentation_Balloon) | 气球实例分割，Mask R-CNN 入门示例 | 见专文
[Mapping Challenge (crowdAI)](0091_Datasets_Image2D_Segmentation_MCC) | 卫星图建筑物分割 | 见专文
[DAGM](0095_Datasets_Image2D_Segmentation_DAGM) | 纹理表面缺陷分割 | 见专文
[CHAOS](0096_Datasets_Image2D_Segmentation_CHAOS) | 腹部 CT/MR 器官分割 | 见专文

## 四、边缘检测

数据集 | 描述 | 简单统计
-- | -- | --
BSDS500 | Berkeley 分割/轮廓数据集，边缘检测标准基准 | 500 张图像（训练 200 / 验证 100 / 测试 200）（待核实）
NYUDv2 | RGB-D 室内场景，也用于边缘检测 | 见 [Datasets 3D](0087_Datasets_Image3D)
Multi-cue | 含边界和亮度/运动线索的数据 | 见专文
Wireframe | 线框解析 | 见专文

详见 [Edge Detection](0098_Datasets_Image2D_EdgeDetection)。

## 五、人脸

数据集 | 描述 | 简单统计
-- | -- | --
LFW | 无约束环境人脸验证基准 | 约 13,233 张图像、5,749 人（待核实）
CelebA | 名人人脸，40 个属性标注 | 约 20 万张图像、1 万+ 身份（待核实）
WIDER FACE | 人脸检测基准，尺度、姿态、遮挡变化大 | 约 3.2 万张图像、约 39 万张人脸（待核实）
VGGFace2 | 人脸识别，跨姿态/年龄 | 331 万张图像、9,131 个身份
FDDB | 人脸检测基准 | （待核实）

详见 [Face](0238_Datasets_Image2D_Face)。

## 六、文字检测与识别（OCR）

数据集 | 描述 | 简单统计
-- | -- | --
ICDAR 2013 / 2015 | 场景文字检测与识别竞赛；2013 为规则文本，2015 为不规则文本 | IC13 约 462 张图像、IC15 约 1,500 张图像（待核实）
SVT | Google 街景文字 | （待核实）
IIIT5K | 场景文字识别 | 约 5,000 张裁剪词图（待核实）
Total-Text | 弯曲文本检测 | 约 1,555 张图像（待核实）
SynthText / MJSynth | 合成训练数据 | MJSynth 约 900 万张；SynthText 约 80 万张（待核实）

详见 [OCR](0240_Datasets_Image2D_OCR)。

## 七、计数

数据集 | 描述 | 简单统计
-- | -- | --
ShanghaiTech | 人群计数，Part A（密集）/ Part B（稀疏） | A 约 482 张、B 约 716 张（待核实）
UCF-QNRF | 高密度人群，点标注 | 约 125 万个人头标注
NWPU-Crowd | 大规模拥挤人群计数与定位 | 5,109 张图像、2,133,375 个标注头部
SKU-110K | 密集商品检测 | 约 1.2 万张图像（待核实）
CARPK / PUCPR+ | 停车场车辆计数 | CARPK 约 1,448 张图像（待核实）

详见 [Object Counting](0239_Datasets_Image2D_OC)。

## 八、关键点与姿态

数据集 | 描述 | 简单统计
-- | -- | --
COCO Keypoints | 人体 17 关键点 | 见 [COCO](0247_Datasets_Image2D_COCO)
MPII Human Pose | 人体姿态 | 约 2.5 万张图像（待核实）
Human3.6M | 室内 3D 人体姿态 | 约 360 万个姿态（待核实）
DensePose-COCO | 人体表面密集对应 | 见专文

详见 [KeyPoint](0248_Datasets_Image2D_KeyPoint)。

## 九、图像检索

数据集 | 描述 | 简单统计
-- | -- | --
Oxford5k / Paris6k | 地标建筑实例检索 | 约 5,062 / 6,412 张图像（待核实）
INRIA Holidays | 度假照片检索 | 约 1,491 张图像（待核实）
UKBench | 物体检索 | 约 10,200 张图像（待核实）
[DeepFashion](0242_Datasets_Image2D_Retrieval_DeepFashion) | 服饰检索与属性 | 见专文
Stanford Online Products | 商品度量学习 | 约 12 万张图像（待核实）
Google Landmarks v2 | 大规模地标识别/检索 | 超过 500 万张图像、20 万个实例标签；测试集 11.8 万张

详见 [Retrieval](0241_Datasets_Image2D_Retrieval)。

## 十、AutoML 基准

数据集 | 描述 | 简单统计
-- | -- | --
NAS-Bench-101 | 神经架构搜索的表格基准，CIFAR-10 | 约 42.3 万个唯一架构，超过 500 万个训练好的模型
NAS-Bench-201 | 搜索空间固定，覆盖 CIFAR-10/100、ImageNet-16-120 | 约 15,625 个架构（待核实）
NDS | Facebook 的网络设计空间基准 | 见专文

详见 [AutoML](0244_Datasets_Image2D_AutoML)、[AutoML NAS](0014_ML_AutoML_NAS)。

## 十一、缺陷与异常检测

数据集 | 描述 | 简单统计
-- | -- | --
MVTec AD | 工业异常检测标准基准 | 15 类物体/纹理，约 5,354 张图像（待核实）；见 [MVTec](0323_ML_Tasks_Image_Anomaly_MVTec)
VisA | PCB、胶囊、蜡烛等 12 个子集 | 约 10,821 张图像（待核实）
MPDD | 金属零件缺陷 | （待核实）
NEU-DET | 热轧带钢表面缺陷 | 6 类缺陷、约 1,800 张图像（待核实）
KolektorSDD | 电气换向器表面缺陷 | 约 399 张图像（待核实）
[DAGM](0095_Datasets_Image2D_Segmentation_DAGM) | 纹理表面缺陷 | 见专文
[DTD-Synthetic](0482_Datasets_Image2D_DTDSynthetic) | 基于 DTD 的合成异常 | 见专文

详见 [Defect](0245_Datasets_Image2D_Defect)，异常检测任务见 [Image Anomaly](0277_ML_Tasks_Image_Anomaly)。

## 多任务数据集

Name | Classification | Detection | Segmentation | 其他
-- | -- | -- | -- | --
[MS COCO](0247_Datasets_Image2D_COCO) | ✅ | ✅ | ✅ | 关键点、字幕、全景分割
[Pascal VOC](0092_Datasets_Image2D_PascalVOC) | ✅ | ✅ | ✅ | 人体部位、动作
LVIS | | ✅ | ✅ | 大词表长尾
Open Images | ✅ | ✅ | ✅ | 视觉关系
ADE20K | | | ✅ | 场景解析、部件

## 标注格式

格式 | 文件形式 | 框的表示 | 说明
-- | -- | -- | --
COCO | 一个 JSON（`images` / `annotations` / `categories`） | `[x, y, w, h]`，左上角 + 宽高，像素坐标 | 支持框、掩码（多边形或 RLE）、关键点；`iscrowd` 标记群体
Pascal VOC | 每张图一个 XML | `xmin, ymin, xmax, ymax`，像素坐标 | 另有 `difficult`、`truncated` 标记；分割用单独的 PNG 掩码
YOLO | 每张图一个 TXT，每行一个目标 | `class cx cy w h`，中心点 + 宽高，**归一化到 0~1** | 简单；类别 id 从 0 起，需另配 names 文件

注意：三种格式的框坐标含义不同，转换时最常见的错误是把 COCO 的左上角当成中心点，或忘记归一化。

## 选择建议

需求 | 建议
-- | --
入门/调试流程 | MNIST、CIFAR-10
通用图像分类预训练 | ImageNet-1k（以及更大的 21k）
检测基准与对比论文 | COCO（主）、VOC（辅）
长尾/大词表 | LVIS、Open Images、Objects365
自动驾驶场景分割 | Cityscapes（精细标注）、CamVid（小规模）
通用分割/基础模型 | SA-1B、ADE20K
工业缺陷 | MVTec AD、VisA，并考虑真实产线数据的差异
可复现 AutoML | NAS-Bench-101 / 201

使用注意：

1. **版本与划分**：同名数据集常有多个版本（VOC2007/2012、COCO 2014/2017），论文数字必须在同版本、同划分下比较。
2. **许可与隐私**：人脸等数据集可能有使用限制或已撤下，商用前需核对许可。
3. **标注噪声与泄漏**：ImageNet 存在标注噪声；自建数据集要避免训练/测试之间的重复图像。
4. **分布差异**：学术基准与真实业务图像常有显著分布差异，最好留一份业务验证集。

## Reference
- [Open Images V4 (arXiv:1811.00982)](https://arxiv.org/abs/1811.00982)
- [Microsoft COCO (arXiv:1405.0312)](https://arxiv.org/abs/1405.0312)
- [LVIS (arXiv:1908.03195)](https://arxiv.org/abs/1908.03195)
- [Cityscapes (arXiv:1604.01685)](https://arxiv.org/abs/1604.01685)
- [ADE20K (arXiv:1608.05442)](https://arxiv.org/abs/1608.05442)
- [Fashion-MNIST (arXiv:1708.07747)](https://arxiv.org/abs/1708.07747)
- [Segment Anything / SA-1B (arXiv:2304.02643)](https://arxiv.org/abs/2304.02643)
- [VGGFace2 (arXiv:1710.08092)](https://arxiv.org/abs/1710.08092)
- [WIDER FACE (arXiv:1511.06523)](https://arxiv.org/abs/1511.06523)
- [SKU-110K (arXiv:1904.00853)](https://arxiv.org/abs/1904.00853)
- [NWPU-Crowd (arXiv:2001.03360)](https://arxiv.org/abs/2001.03360)
- [UCF-QNRF (arXiv:1808.01050)](https://arxiv.org/abs/1808.01050)
- [VisA (arXiv:2207.14315)](https://arxiv.org/abs/2207.14315)
- [iNaturalist (arXiv:1707.06642)](https://arxiv.org/abs/1707.06642)
- [Places (arXiv:1610.02055)](https://arxiv.org/abs/1610.02055)
- [Google Landmarks v2 (arXiv:2004.01804)](https://arxiv.org/abs/2004.01804)
- [ImageNet Large Scale Visual Recognition Challenge (arXiv:1409.0575)](https://arxiv.org/abs/1409.0575)
- [NAS-Bench-101 (arXiv:1902.09635)](https://arxiv.org/abs/1902.09635)
- [NAS-Bench-201 (arXiv:2001.00326)](https://arxiv.org/abs/2001.00326)

