---
Title | Datasets 3D
-- | --
Created @ | `2021-07-27T05:32:49Z`
Updated @| `2026-11-11T09:17:11Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/87)

---
# 3D 数据集

3D 数据按**数据形态**和**任务**差异很大：CAD 网格、扫描的物体、室内 RGB-D 重建、车载 LiDAR 点云、地面/航空扫描的城市点云、6D 位姿数据等。本文按应用场景把常用 3D 数据集分成几类，每类给出数据集的简单描述和规模统计。相关的算法与工具见 [3D](0076_3D)、[3D 深度学习](0233_3D_DL)、[点云配准](0235_3D_Algos_Registration)；位姿数据集见 [BOP](0544_Datasets_BOP)；3D 异常检测中的 2D 对照数据集见 [MVTec](0323_ML_Tasks_Image_Anomaly_MVTec)。

> 规模数字说明：大部分来自对应论文的摘要或官网；标"（待核实）"的是凭记忆给出、未逐项核对的数字，使用前请以官方页面为准。不同版本、不同划分的统计可能不同。

## 总览

类别 | 数据形态 | 主要任务 | 代表数据集
-- | -- | -- | --
物体/CAD 模型 | 网格、体素、点云 | 形状分类、部件分割、检索、重建、生成 | ModelNet、ShapeNet、ScanObjectNN、Objaverse、GSO、ABC、Thingi10K
图像-3D 形状对齐 | 图像 + CAD 模型 | 单图 3D 重建、位姿估计 | Pix3D、ObjectNet3D、Pascal3D+
室内场景 | RGB-D 序列、重建网格/点云 | 语义/实例分割、3D 检测、重建 | ScanNet、S3DIS、Matterport3D、SUN RGB-D、NYU Depth V2
自动驾驶 | LiDAR + 相机 + 雷达 | 3D 检测、跟踪、语义分割、预测 | KITTI、SemanticKITTI、nuScenes、Waymo、Argoverse、ONCE、Lyft
室外/城市点云 | 地面/移动/航空激光扫描 | 语义分割 | Semantic3D、Toronto-3D、Paris-Lille-3D、SensatUrban
6D 位姿 | RGB-D + 物体模型 | 物体位姿估计 | BOP、YCB-Video、LineMOD、T-LESS、Objectron
重建与配准 | RGB-D 片段、多视图图像 | 点云配准、多视图立体、NeRF | 3DMatch、DTU、Tanks and Temples、CO3D
工业 3D 异常检测 | 工业扫描点云/深度图 | 3D 异常检测与定位 | MVTec 3D-AD、Real3D-AD

## 一、物体与 CAD 模型

数据集 | 描述 | 简单统计
-- | -- | --
[ModelNet](http://modelnet.cs.princeton.edu/) | 普林斯顿的 CAD 模型集，形状分类标准基准；ModelNet10 / ModelNet40 是其子集 | ModelNet40：12,311 个模型、40 类；ModelNet10：4,899 个模型、10 类
[ShapeNet](https://shapenet.org/) | 大规模带标注的 3D 模型库，按 WordNet 同义词集组织；ShapeNetCore 是常用子集，ShapeNet-Part 带部件标注 | 论文称已索引超过 300 万个模型，其中 22 万个分到 3,135 个类别；ShapeNetCore 约 5.1 万个模型、55 类（待核实）
[ScanObjectNN](https://hkust-vgd.github.io/scanobjectnn/) | 真实扫描的物体点云，含背景、遮挡，比 ModelNet 更难 | 约 15,000 个物体、15 类（待核实）
[Objaverse](https://objaverse.allenai.org/) | 大规模带字幕/标签的 3D 模型集，用于生成与大模型研究 | 1.0 版：80 万+ 个模型；另有更大的 Objaverse-XL（待核实）
[Google Scanned Objects (GSO)](https://goo.gle/scanned-objects) | 高质量扫描的家居物品，带纹理，常用于机器人与仿真 | 约 1,030 个物体（待核实）；论文：[arXiv:2204.11918](https://arxiv.org/abs/2204.11918)
[ABC](https://deep-geometry.github.io/abc-dataset/) | 机械/工程 CAD 模型，带精确的参数曲面和几何特征标注 | 约 100 万个 CAD 模型（待核实）
[Thingi10K](https://ten-thousand-models.appspot.com/) | 来自 3D 打印模型分享社区的网格 | 10,000 个模型
[Stanford 3D Scanning Repository](http://graphics.stanford.edu/data/3Dscanrep/) | 经典扫描模型（Bunny、Dragon、Armadillo 等），配准、重建算法常用的测试对象 | 规模小，每个对象一个高精度扫描
[Georgia Tech Large Geometric Models](https://www.cc.gatech.edu/projects/large_models/) | 大型几何模型存档，用于测试网格处理算法 | —
[3D MNIST](https://www.kaggle.com/daavoo/3d-mnist/Kernels) | 把 MNIST 手写数字转成 3D 点云/体素 | 入门级数据集

## 二、图像与 3D 形状对齐

数据集 | 描述 | 简单统计
-- | -- | --
[Pix3D](http://pix3d.csail.mit.edu/) | 真实图像与对应 3D 模型像素级对齐，用于单图 3D 形状重建 | 约 10,069 张图像、395 个形状、9 类（待核实）
[ObjectNet3D](https://cvgl.stanford.edu/projects/objectnet3d/) | 图像中的物体与 3D 模型对齐，带 3D 位姿标注 | 约 100 类、9 万张图像、4.4 万个 3D 形状（待核实）
[Pascal3D+](https://cvgl.stanford.edu/projects/pascal3d.html) | 在 PASCAL VOC 与 ImageNet 图像上加 3D 位姿标注 | 12 类，数万张图像（待核实）

## 三、室内场景

数据集 | 描述 | 简单统计
-- | -- | --
[ScanNet](http://www.scan-net.org/) | 室内 RGB-D 视频及重建，带相机位姿、表面重建与语义分割标注 | 250 万个视图、1,513 个场景
[S3DIS](http://3dsemantics.stanford.edu/) | 斯坦福大规模室内空间，点云逐点语义/实例标注（2D-3D-S 的一部分） | 6 个区域、约 271 个房间、13 类（待核实）；2D-3D-S 含 7 万+ 张 RGB 图像，覆盖 6,000 m² 以上
[Matterport3D](https://niessner.github.io/Matterport/) | 建筑级室内 RGB-D 数据，含全景图和语义标注 | 90 个建筑场景、10,800 个全景视图、194,400 张 RGB-D 图像
[SUN RGB-D](https://rgbd.cs.princeton.edu/) | 室内 RGB-D 图像，带 3D 包围框，常用于室内 3D 检测 | 约 10,335 张 RGB-D 图像（待核实）
[NYU Depth V2](https://cs.nyu.edu/~fergus/datasets/nyu_depth_v2.html) | Kinect 室内场景 RGB-D，深度估计与分割经典基准 | 1,449 张标注图像（待核实）
[Replica](https://github.com/facebookresearch/Replica-Dataset) | 高质量室内场景重建，用于仿真与 SLAM | 18 个场景（待核实）

## 四、自动驾驶（LiDAR 为主）

数据集 | 描述 | 简单统计
-- | -- | --
[KITTI](http://www.cvlibs.net/datasets/kitti/eval_object.php?obj_benchmark=3d) | 最早的主流自动驾驶基准之一，Velodyne 64 线 LiDAR + 相机，含 3D 检测基准 | 3D 检测：7,481 帧训练 / 7,518 帧测试（待核实）
[SemanticKITTI](http://semantic-kitti.org/) | 在 KITTI Odometry 序列上逐点标注，语义/全景分割 | 22 个序列、约 43,552 帧、28 类（评测常用 19 类）（待核实）
[KITTI-360](https://www.cvlibs.net/datasets/kitti-360/) | KITTI 后继，郊区驾驶，2D/3D 语义实例标注 | 15 万+ 张图像、10 亿个 3D 点
[nuScenes](https://www.nuscenes.org/) | 6 相机 + 5 雷达 + 1 LiDAR，360° 全覆盖，3D 检测与跟踪 | 1,000 个场景（每个 20 秒），23 类 3D 框、8 个属性
[Waymo Open](https://waymo.com/open/data/) | 高质量 LiDAR + 相机，场景多样 | 论文版本：1,150 个场景（每个 20 秒）；后续版本更大（待核实）
[Argoverse 1](https://www.argoverse.org/) | 3D 跟踪与运动预测，附高精地图 | 运动预测超过 30 万个 5 秒场景；290 km 车道地图
[Argoverse 2](https://www.argoverse.org/av2.html) | 三个数据集：传感器、LiDAR、运动预测 | 传感器 1,000 个序列、26 类；LiDAR 2 万个无标注序列；运动预测 25 万个场景
[ONCE](https://once-for-auto-driving.github.io/) | 面向自监督/半监督的大规模数据 | 100 万个 LiDAR 场景、700 万张相机图像、144 驾驶小时
[Lyft Level 5](https://self-driving.lyft.com/level5/data/) | Lyft 自动驾驶数据集，含感知与预测 | （待核实）

## 五、室外与城市点云

数据集 | 描述 | 简单统计
-- | -- | --
[Semantic3D](http://www.semantic3d.net/) | 地面激光扫描（TLS）的大规模室外点云分类基准 | 8 个语义类别；点数约数十亿（待核实）
[Toronto-3D](https://github.com/WeikaiTan/Toronto-3D) | 车载移动激光扫描的城市道路点云 | 约 1 km 道路、约 7,830 万个点、8 个类别
[Paris-Lille-3D](https://npm3d.fr/paris-lille-3d) | 移动激光扫描的城市点云，高质量标注 | 约 1.4 亿个点、50 类（基准用 9 类）（待核实）
[SensatUrban](https://github.com/QingyongHu/SensatUrban) | 英国三座城市的航空摄影测量点云 | 约 7.6 km²，13 个语义类别

## 六、6D 位姿与物体数据

数据集 | 描述 | 简单统计
-- | -- | --
[BOP](0544_Datasets_BOP) | 6D 物体位姿估计基准，整合多个数据集与统一评测 | 见专文
YCB-Video | YCB 物体的 RGB-D 视频，6D 位姿标注，随 PoseCNN 发布 | 21 个物体、92 个视频、133,827 帧
LineMOD | 经典的杂乱场景 6D 位姿数据集 | 约 15 个物体（待核实）
T-LESS | 工业无纹理物体，6D 位姿 | 约 30 个物体（待核实）
[Objectron](https://github.com/google-research-datasets/Objectron) | 手机拍摄的以物体为中心的视频，带 3D 包围框 | 9 类、14,819 个视频、约 400 万张标注图像

## 七、重建与配准

数据集 | 描述 | 简单统计
-- | -- | --
[3DMatch](https://3dmatch.cs.princeton.edu/) | 来自多个 RGB-D 重建数据集的局部几何描述子与配准基准 | 约 62 个场景（待核实）
[DTU](https://roboimagedata.compute.dtu.dk/) | 多视图立体（MVS）经典数据集，带结构光真值 | 约 124 个场景（待核实）
[Tanks and Temples](https://www.tanksandtemples.org/) | 大场景多视图重建基准 | （待核实）
[CO3D](https://github.com/facebookresearch/co3d) | 通用物体的多视图视频，带相机与点云标注 | 约 150 万帧、近 19,000 个视频、50 个 MS-COCO 类别

点云配准的评测指标与方法见 [点云配准指标](0236_3D_Algos_Registration_Metrics)、[配准](0235_3D_Algos_Registration)。

## 八、工业 3D 异常检测

数据集 | 描述 | 简单统计
-- | -- | --
[MVTec 3D-AD](https://www.mvtec.com/research-teaching/datasets/mvtec-3d-ad) | 工业 3D 传感器采集的深度扫描，无监督异常检测与定位 | 10 个物体类别
[Real3D-AD](https://github.com/M-3LAB/Real3D-AD) | 高精度点云异常检测数据集，360° 覆盖 | 1,254 个高分辨率 3D 样本，每个样本数万到数百万个点

2D 工业异常检测数据集见 [MVTec](0323_ML_Tasks_Image_Anomaly_MVTec)。

## 选择建议

需求 | 建议
-- | --
点云分类入门 | ModelNet40；想要更接近真实情况再用 ScanObjectNN
形状生成/大模型 | ShapeNet、Objaverse
室内语义分割 / 3D 检测 | ScanNet、S3DIS、SUN RGB-D
自动驾驶 3D 检测 | KITTI（入门）、nuScenes、Waymo（更大更全）
自动驾驶点云分割 | SemanticKITTI、nuScenes-lidarseg
城市点云分割 | Toronto-3D、Semantic3D、SensatUrban
物体位姿 / 抓取 | BOP、YCB-Video
点云配准 | 3DMatch、ModelNet40（合成）、KITTI（室外）
工业检测 | MVTec 3D-AD、Real3D-AD

使用时注意：

1. **版本与划分**：同名数据集常有多个版本（如 ModelNet10/40、ShapeNetCore v1/v2），论文数字必须在同版本、同划分下比较。
2. **坐标与单位**：不同数据集的坐标系、单位、法向约定不同，混用前要统一。
3. **合成 vs 真实**：CAD 数据集（ModelNet、ShapeNet）干净、无遮挡，真实扫描（ScanObjectNN、ScanNet）噪声和遮挡明显，模型在两者之间常有显著差距。
4. **许可**：不少数据集有非商用或申请使用条款（如 Argoverse 2 为 CC BY-NC-SA 4.0），商用前需核对。

## Reference
- [Open3D-ML - datasets](https://github.com/intel-isl/Open3D-ML#datasets)
- [工业3D 模型库](https://www.traceparts.cn/)
- [Shapenet](https://shapenet.org/)
- [Modelnet](http://modelnet.cs.princeton.edu/)
- [Pascal 3D+](https://cvgl.stanford.edu/projects/pascal3d.html)
- [Large Geometric Models Archive at Georgia Tech](https://www.cc.gatech.edu/projects/large_models/)
- [The Stanford 3D Scanning Repository](http://graphics.stanford.edu/data/3Dscanrep/)
- [ObjectNet3D](https://cvgl.stanford.edu/projects/objectnet3d/)
- [Pix3D](http://pix3d.csail.mit.edu/)
- [3D Mnist](https://www.kaggle.com/daavoo/3d-mnist/Kernels)
- [Google Scanned Objects (arXiv:2204.11918)](https://arxiv.org/abs/2204.11918)
- [ShapeNet (arXiv:1512.03012)](https://arxiv.org/abs/1512.03012)
- [ScanNet (arXiv:1702.04405)](https://arxiv.org/abs/1702.04405)
- [Matterport3D (arXiv:1709.06158)](https://arxiv.org/abs/1709.06158)
- [Joint 2D-3D-Semantic Data (arXiv:1702.01105)](https://arxiv.org/abs/1702.01105)
- [SemanticKITTI (arXiv:1904.01416)](https://arxiv.org/abs/1904.01416)
- [KITTI-360 (arXiv:2109.13410)](https://arxiv.org/abs/2109.13410)
- [nuScenes (arXiv:1903.11027)](https://arxiv.org/abs/1903.11027)
- [Waymo Open Dataset (arXiv:1912.04838)](https://arxiv.org/abs/1912.04838)
- [Argoverse (arXiv:1911.02620)](https://arxiv.org/abs/1911.02620)
- [Argoverse 2 (arXiv:2301.00493)](https://arxiv.org/abs/2301.00493)
- [ONCE (arXiv:2106.11037)](https://arxiv.org/abs/2106.11037)
- [Semantic3D (arXiv:1704.03847)](https://arxiv.org/abs/1704.03847)
- [Toronto-3D (arXiv:2003.08284)](https://arxiv.org/abs/2003.08284)
- [Paris-Lille-3D (arXiv:1712.00032)](https://arxiv.org/abs/1712.00032)
- [SensatUrban (arXiv:2009.03137)](https://arxiv.org/abs/2009.03137)
- [Objaverse (arXiv:2212.08051)](https://arxiv.org/abs/2212.08051)
- [ScanObjectNN (arXiv:1908.04616)](https://arxiv.org/abs/1908.04616)
- [ABC (arXiv:1812.06216)](https://arxiv.org/abs/1812.06216)
- [Thingi10K (arXiv:1605.04797)](https://arxiv.org/abs/1605.04797)
- [3DMatch (arXiv:1603.08182)](https://arxiv.org/abs/1603.08182)
- [CO3D (arXiv:2109.00512)](https://arxiv.org/abs/2109.00512)
- [PoseCNN / YCB-Video (arXiv:1711.00199)](https://arxiv.org/abs/1711.00199)
- [Objectron (arXiv:2012.09988)](https://arxiv.org/abs/2012.09988)
- [MVTec 3D-AD (arXiv:2112.09045)](https://arxiv.org/abs/2112.09045)
- [Real3D-AD (arXiv:2309.13226)](https://arxiv.org/abs/2309.13226)

