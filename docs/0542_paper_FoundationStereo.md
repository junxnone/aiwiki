---
Title | paper FoundationStereo
-- | --
Created @ | `2026-05-19T06:07:20Z`
Updated @| `2026-05-19T06:07:20Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/542)

---
# FoundationStereo 系列
- **FoundationStereo**: 零样本立体匹配基础模型
- **Fast-FoundationStereo**: 实时零样本立体匹配模型

## FoundationStereo 
### 1. 概述
FoundationStereo 是 NVIDIA 于 2025 年推出的**双目立体匹配基础模型**（CVPR 2025 Oral，最佳论文提名），核心目标是**跨领域零样本泛化**，无需在目标场景微调即可输出高精度视差/深度图，解决传统立体匹配模型“领域依赖强、泛化差、需重训”的痛点。

### 2. 核心技术细节
#### 2.1 训练数据：FSD 百万级合成数据集
- 构建 **100 万对高保真合成双目图像**，覆盖室内/室外、无纹理/反射/透明物体、复杂光照、多视角/测距范围。
- 自动自清洁 pipeline：剔除模糊、歧义、低质量样本，提升数据有效性。

#### 2.2 网络架构（三模块）
1. **特征提取（STA 侧调骨干）**
   - 融合 **DepthAnything V2（ViT）** 强单目先验 + 轻量 CNN 适配器。
   - 双分支结构：ViT 捕获全局语义，CNN 提取局部细节，弥合“合成→真实”域间隙。

2. **代价体构建（GWC + 多尺度）**
   - 分组相关代价（Group-wise Correlation），降低内存与计算量。
   - 4/8/16/32 倍多尺度特征，适配大/小视差与不同尺度物体。

3. **代价过滤与视差细化（AHCF + ConvGRU）**
   - **AHCF（混合高阶代价过滤）**：
     - APC（金字塔代价聚合）：3D CNN 局部聚合，扩大感受野。
     - DT（Disparity Transformer）：全局自注意力，长程上下文建模。
   - **ConvGRU 迭代细化**：多轮循环优化，修正边缘/弱纹理区域误差。

### 3. 性能表现（RTX 3090，640×480）
- **推理速度**：PyTorch ≈ **496 ms/帧（≈ 2 FPS）**
- **模型参数**：≈ 80M
- **零样本精度（Middlebury）**：
  - BP-2（坏像素率）：**1.29%**（SOTA 级）
  - 领先所有传统/轻量模型，泛化性碾压需微调方法

### 4. 模型定位
- **学术定位**：**立体匹配领域首个基础模型**，定义“零样本泛化”新范式。
- **应用定位**：**高精度非实时场景**
  - 三维重建、工业检测、考古/文物数字化、高精度地图构建
  - 机器人/自动驾驶**离线分析**、AR/VR 高质量深度生成

### 5. 发展趋势与局限
#### 趋势
- 立体匹配向**大模型+零样本**演进，融合视觉基础模型先验。
- 合成数据+自监督成为跨域泛化核心路径。

#### 局限
- **速度极慢**：无法用于机器人、自动驾驶等实时系统。
- **计算/内存开销大**：依赖高端 GPU，边缘端无法部署。
- 高反光/全透明物体仍存在误差。

### 6. 参考资源
- 论文：FoundationStereo: Zero-Shot Stereo Matching (arXiv:2501.09898, CVPR 2025)
- 代码：https://github.com/NVlabs/FoundationStereo
- 项目页：https://nvlabs.github.io/FoundationStereo/

## Fast-FoundationStereo
### 1. 概述
Fast-FoundationStereo（CVPR 2026）是 FoundationStereo 的**实时加速版本**，以“**零样本泛化 + 实时推理**”为核心，首次在保持强跨域能力的同时，实现 **10–24× 加速**，填补“高精度”与“高速度”的技术鸿沟。

### 2. 核心技术细节（分治加速策略）
#### 2.1 特征提取：知识蒸馏（教师→学生）
- 教师：FoundationStereo（DepthAnything V2 ViT + STA CNN）
- 学生：**EdgeNeXt-S 轻量 CNN**（单分支）
- 蒸馏目标：对齐 ViT 全局语义与 CNN 局部特征，**参数从 80M → 14.6M**

#### 2.2 代价过滤：块级神经架构搜索（B-NAS）
- 自动搜索最优 3D CNN/Transformer 混合模块
- 复杂度从 O(n^N) → O(n)，在延迟预算下最大化精度
- 保留长程依赖，剔除冗余计算

#### 2.3 视差细化：结构化剪枝（ConvGRU）
- 分析循环依赖图，移除 ConvGRU 冗余神经元/连接
- 迭代次数减少，精度几乎无损

#### 2.4 数据增强：140 万真实伪标签
- 互联网双目视频自动生成高质量伪标签，补充合成数据，提升真实场景泛化

### 3. 性能对比（同分辨率 640×480，RTX 3090）
| 指标 | FoundationStereo | Fast-FoundationStereo (PyTorch) | Fast-FoundationStereo (TensorRT) |
|:--- |:--- |:--- |:--- |
| 延迟 | 496 ms | 49 ms | 21 ms |
| FPS | ≈ 2 | ≈ 20 | ≈ 47 |
| 加速比 | 1× | 10× | 24× |
| Middlebury BP-2 | 1.29% | 2.53% | 2.8% |
| 参数 | 80M | 14.6M | 14.6M |

### 4. 模型定位
#### 学术定位
- **实时零样本立体匹配新标杆**，首次实现“强泛化 + 实时”统一
- 为基础模型**高效化**提供范式（蒸馏 + NAS + 剪枝）

#### 应用定位
- **实时部署场景**：
  - 自主机器人（移动/抓取）、自动驾驶（车载双目）
  - AR/VR 实时深度感知、无人机避障、工业在线检测
- **边缘/端侧潜力**：TensorRT 优化后可向 Jetson 等嵌入式平台迁移

### 5. 发展趋势
1. **基础模型实时化**：大模型→轻量学生模型成为主流路径
2. **效率-精度权衡家族**：多版本适配不同延迟预算（Fast/Standard/Accurate）
3. **端边云协同**：云端蒸馏训练 + 边缘实时推理
4. **多模态融合**：与 LiDAR/IMU 融合，提升鲁棒性

### 6. 参考资源
- 论文：Fast-FoundationStereo: Real-Time Zero-Shot Stereo Matching (arXiv:2512.11130, CVPR 2026)
- 代码：https://github.com/NVlabs/Fast-FoundationStereo
- 项目页：https://nvlabs.github.io/Fast-FoundationStereo/

---

## 总结
- **FoundationStereo**：**精度之王、泛化标杆**，适合离线高精度任务
- **Fast-FoundationStereo**：**速度革命、泛化保留**，面向实时部署

两者共同构成 NVIDIA 立体匹配**“高精度—实时化”**完整技术栈，推动零样本 3D 感知从实验室走向产业落地。
