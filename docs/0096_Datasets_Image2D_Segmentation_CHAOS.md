---
Title | Datasets Image2D Segmentation CHAOS
-- | --
Created @ | `2020-07-28T08:59:49Z`
Updated @| `2026-11-11T09:36:53Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/96)

---
# CHAOS

CHAOS（**C**ombined (CT-MR) **H**ealthy **A**bdominal **O**rgan **S**egmentation）是 IEEE ISBI 2019 的医学图像分割挑战赛，论文 [*CHAOS Challenge - Combined (CT-MR) Healthy Abdominal Organ Segmentation*](https://arxiv.org/abs/2001.06535)。目标是在**健康**受试者的腹部 CT 与 MRI 中分割肝脏、肾脏、脾脏，并强调跨模态（CT/MR）分割。

## 任务与标注

Task | Description
-- | --
Liver Segmentation (CT & MRI) | 同一模型同时处理 CT 与 MRI 肝脏分割（跨模态）
Liver Segmentation (CT only) | 仅 CT 肝脏
Liver Segmentation (MRI only) | 仅 MRI 肝脏
Segmentation of abdominal organs (CT & MRI) | CT+MRI 联合的腹部多器官设定（待核实）
Segmentation of abdominal organs (MRI only) | MRI 的肝、左右肾、脾

标注类别：CT 仅肝脏；MRI 为肝脏、右肾、左肾、脾脏。

## 规模统计

项目 | 数值（部分待核实，以官网/论文为准）
-- | --
CT | 40 例患者（20 训练 / 20 测试），肝脏标注；DICOM，512x512，层厚约 3 mm（待核实）
MRI | 40 例患者（20 训练 / 20 测试）；每例 3 个序列：T1-DUAL（in-phase、out-phase）与 T2-SPIR；DICOM，约 256x256（待核实）
标注 | 训练集提供 PNG mask；测试集标注不公开，需提交评测

## 数据模态与示例图

- CT
- MRI
  - T1-DUAL
    - In-Phase
    - Out-Phase
  - T2-SPIR
- DICOM Format - Digital Imaging and Communications in Medicine

Name | Image
-- | --
Abdominal CT | ![image](https://user-images.githubusercontent.com/2216970/88643626-81699780-d0f4-11ea-9e3e-5c2e6a2a984b.png)
abdominal MRI T2-SPIR | ![image](https://user-images.githubusercontent.com/2216970/88643784-bc6bcb00-d0f4-11ea-8560-ab3175eca1ab.png)
abdominal MRI T1-DUAL In-Phase | ![image](https://user-images.githubusercontent.com/2216970/88644279-5c295900-d0f5-11ea-8b84-3b5666d7c94f.png)

## 目录结构与加载示例

大致结构（以官方 zip 为准，待核实）：

```
CHAOS_Train_Sets/Train_Sets/
  CT/<case_id>/DICOM_anon/*.dcm   Ground/*.png
  MR/<case_id>/T1DUAL/DICOM_anon/{InPhase,OutPhase}/*.dcm  Ground/*.png
  MR/<case_id>/T2SPIR/DICOM_anon/*.dcm   Ground/*.png
```

MRI mask 灰度编码常见为：肝 63、右肾 126、左肾 189、脾 252（待核实）；CT mask 前景为 255。

读取 DICOM 与 mask：

```python
import glob
import numpy as np
import pydicom, cv2

files = sorted(glob.glob("CT/1/DICOM_anon/*.dcm"))
slices = [pydicom.dcmread(f) for f in files]
slices.sort(key=lambda s: int(s.InstanceNumber))     # 按层序排序
vol = np.stack([s.pixel_array for s in slices]).astype(np.float32)
vol = vol * float(slices[0].RescaleSlope) + float(slices[0].RescaleIntercept)  # CT 转 HU
mask = cv2.imread("CT/1/Ground/liver_GT_001.png", 0)
```

## 下载与许可

- 需在 [CHAOS 官网 Download 页](https://chaos.grand-challenge.org/Download/) 注册后下载。
- 许可：研究使用，具体见官方条款（待核实）。

## 评测指标

- 官方使用 4 项指标综合打分：Dice、相对绝对体积差（RAVD）、平均对称表面距离（ASSD）、最大对称表面距离（MSSD）。
- 常见基线数值（待核实）：nnU-Net 等在 CT 肝脏 Dice 可达约 0.97。

## 常见坑

- DICOM 层序不一定与文件名一致，要按 `InstanceNumber` 或 `ImagePositionPatient` 排序。
- T1-DUAL 的 In-Phase / Out-Phase 是两个子序列，需分别处理，不要混层。
- CT 要先用 RescaleSlope/Intercept 转 HU 再做窗宽窗位归一化；MRI 强度无标准单位，需逐例归一化。
- MRI mask 灰度编码不是 0/1/2/3 类别索引，需重映射。
- 不同模态分辨率、层厚差异大，跨模态训练需重采样。

## 相关数据集与站内链接

- [Segmentation 分割数据集](0097_Datasets_Image2D_Segmentation)、[Datasets Image2D](0018_Datasets_Image2D)
- 3D 数据集见 [Datasets 3D](0087_Datasets_Image3D)

## Reference
- [Challenge](https://chaos.grand-challenge.org/Combined_Healthy_Abdominal_Organ_Segmentation/)
- [Download Train and Test Data](https://chaos.grand-challenge.org/Download/)
- [Data Info](https://chaos.grand-challenge.org/Data/)
- [paper - 2020 - CHAOS Challenge](https://arxiv.org/abs/2001.06535)
- [DICOM](http://dicom.nema.org/Dicom/supps/sup30_lb.pdf)
- [医学图像之DICOM格式解析](https://www.cnblogs.com/XDU-Lakers/p/9863114.html)

