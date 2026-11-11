---
Title | Datasets Image2D DTD
-- | --
Created @ | `2024-10-12T02:51:26Z`
Updated @| `2026-11-11T09:37:25Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/481)

---
# DTD - Describable Textures Dataset

DTD（可描述纹理数据集）由牛津 VGG 组（Cimpoi、Maji、Kokkinos、Mohamed、Vedaldi）发布，论文为 CVPR 2014 的 *Describing Textures in the Wild*（arXiv:1311.3618）。它用一组以人为中心的属性给纹理图像做标注，灵感来自纹理的感知属性；**目标**是让机器具备类似人类的纹理描述能力。图像来自互联网（Google 和 Flickr）。属于[分类](0028_Datasets_Image2D_Classification)类数据集，也被用于合成异常数据，见 [DTD-Synthetic](0482_Datasets_Image2D_DTDSynthetic)。总入口见 [Datasets Image2D](0018_Datasets_Image2D)。

![image](https://github.com/user-attachments/assets/e1f72e8e-4df2-4dc3-bd43-9bd4b4af5085)

## 规模统计

项目 | 内容
-- | --
图像数 | 5,640 张
类别数 | 47 个纹理属性词，每类 120 张
图像尺寸 | 300×300 到 640×640，且图像中至少 90% 的面积表现该类属性
划分 | 训练 / 验证 / 测试各三分之一，每类每份 40 张；官方提供 10 种随机划分
标注 | 关键属性（主类别）+ 联合属性（多标签，由 Amazon Mechanical Turk 多轮标注）
来源 | 用属性词及相关词作为查询，在 Google 和 Flickr 上搜索

## 类别（47 个纹理属性）

原论文从 Bhusan、Rao 和 Lohse 确定的 98 个纹理描述词出发：忽略与表面形状更相关的词（如 corrugated）和不一定对应视觉特征的词（如 messy），再把相似词合并（如 coiled、spiraled、corkscrewed 合为一个）。最终类别如下：

banded（带状）、blotchy（斑驳）、braided（编织辫状）、bubbly（多泡）、bumpy（凹凸不平）、chequered（方格）、cobwebbed（蛛网）、cracked（开裂）、crosshatched（交叉线影）、crystalline（结晶）、dotted（点状）、fibrous（纤维）、flecked（斑点）、freckled（雀斑）、frilly（褶边）、gauzy（薄纱）、grid（网格）、grooved（凹槽）、honeycombed（蜂窝）、interlaced（交织）、knitted（针织）、lacelike（蕾丝）、lined（线条）、marbled（大理石纹）、matted（毡状）、meshed（网眼）、paisley（佩斯利花纹）、perforated（穿孔）、pitted（坑洼）、pleated（打褶）、polka-dotted（圆点）、porous（多孔）、potholed（坑洞）、scaly（鳞片）、smeared（涂抹）、spiralled（螺旋）、sprinkled（散布）、stained（污渍）、stratified（分层）、striped（条纹）、studded（镶钉）、swirly（漩涡）、veined（脉络）、waffled（华夫格）、woven（编织）、wrinkled（皱褶）、zigzagged（锯齿）。

## 目录结构与标注格式

解压后的目录结构大致为（以官网为准）：

```
dtd/
├── images/
│   ├── banded/banded_0002.jpg ...
│   └── ... (47 个类别目录)
├── imdb/imdb.mat
└── labels/
    ├── train1.txt val1.txt test1.txt   # 第 1 份划分，... 共 10 份
    ├── labels_joint_anno.txt           # 联合属性（多标签）
    └── classes.txt
```

`trainN.txt` 等每行为相对 `images/` 的图像路径，如 `banded/banded_0002.jpg`，类别即目录名。

解析示例：

```python
from pathlib import Path

root = Path("dtd")
classes = sorted(p.name for p in (root / "images").iterdir())
cid = {c: i for i, c in enumerate(classes)}

def load(split="train", part=1):
    lines = (root / "labels" / f"{split}{part}.txt").read_text().split()
    return [(root / "images" / l, cid[l.split("/")[0]]) for l in lines]

train = load("train", 1)
print(len(classes), len(train))   # 47, 1880
```

torchvision 已内置：

```python
from torchvision import datasets, transforms

tf = transforms.Compose([transforms.Resize(256), transforms.CenterCrop(224), transforms.ToTensor()])
ds = datasets.DTD(root="data", split="train", partition=1, transform=tf, download=True)
img, label = ds[0]
```

`split` 取 `train` / `val` / `test`，`partition` 取 1~10。

## 下载与许可

- 官网：[https://www.robots.ox.ac.uk/~vgg/data/dtd/](https://www.robots.ox.ac.uk/~vgg/data/dtd/)，提供图像包、标注与划分包。官网声明仅供计算机视觉研究使用。
- 图像来自网络，版权属于原作者，商用前需注意（待核实具体许可条款）。

## 评测与基线

- 分类任务：按 10 份划分取平均准确率。
- 论文对比了 IFV、DCNN（ImageNet 预训练 CNN 特征）等纹理表示，其中 IFV+DCNN 组合效果最好（具体精度待核实）。
- 现代做法：用预训练模型线性探测（linear probe）或微调；CLIP 等多模态模型常把 DTD 作为下游评测之一（具体精度待核实）。

## 常见坑

1. 有 10 份划分，论文对比需说明用的是第几份或取平均；torchvision 默认 `partition=1`。
2. 训练/验证/测试各 40 张每类，训练集很小（1,880 张），容易过拟合，需要预训练或强增强。
3. 图像尺寸不一，不要假设固定大小，需统一 resize/crop；纹理任务中过度 resize 会破坏纹理尺度。
4. 联合属性是多标签，和主类别单标签的评测要区分。
5. 部分图像存在标注噪声（原论文也讨论过）。

## 相关

- [DTD-Synthetic](0482_Datasets_Image2D_DTDSynthetic)：用 DTD 合成纹理异常
- [Defect 缺陷汇总](0245_Datasets_Image2D_Defect)
- [Classification 分类汇总](0028_Datasets_Image2D_Classification)
- [Datasets Image2D](0018_Datasets_Image2D)

## Reference

- [paper 2013 Describing Textures in the Wild](https://arxiv.org/abs/1311.3618)
- [官网](https://www.robots.ox.ac.uk/~vgg/data/dtd/)

