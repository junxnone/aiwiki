---
Title | Datasets Image2D DTD
-- | --
Created @ | `2024-10-12T02:51:26Z`
Updated @| `2024-10-12T02:51:26Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/481)

---
# DTD - Describable Textures Dataset
- **可描述纹理数据集** - 用一系列以人为中心的属性进行注释，灵感来自纹理的感知属性
- **目标**是在机器中重现人类对纹理提取的能力。
- 数据来源于互联网 Google & Flickr

![image](https://github.com/user-attachments/assets/e1f72e8e-4df2-4dc3-bd43-9bd4b4af5085)


## DTD Details

```
由 5640 张图像组成，根据从人类感知中获得灵感的 47 个术语（类别）列表进行组织。
每个类别有 120 张图像。图像尺寸在 300x300 到 640x640 之间，并且图像中至少有 90%的表面代表类别属性。
这些图像是通过在谷歌和 Flickr 上输入我们提出的属性和相关术语作为搜索查询来收集的。
这些图像通过亚马逊 Mechanical Turk 进行了多次标注。对于每张图像，我们提供关键属性（主要类别）和一系列联合属性。

数据被平均分为三部分，分别用于训练、验证和测试，每个类别每个部分有 40 张图像。
我们提供关键属性和联合属性的真实标注，以及我们用于评估的 10 个数据分割。

```

### Lables
- 从 Bhusan、Rao 和 Lohse 所确定的 98 个用于描述纹理的词汇入手。他们的研究旨在为纹理识别实现类似于颜色词对描述颜色空间所达到的效果，但主要关注纹理感知的认知方面。
- 忽略了一些与表面形状属性更相关的词汇（如 “corrugated”）以及那些不一定对应视觉特征的词汇（如 “messy”）。
- 对剩余词汇进行分析，将相似的词汇进行合并，例如将 “coiled”、“spiraled” 和 “corkscrewed” 合并为一个术语。

```
**纹理属性类别**
    - **banded（带状的）**
    - **blotchy（有斑点的）**
    - **braided（编织的）**
    - **bubbly（多泡的）**
    - **bumpy（崎岖不平的）**
    - **chequered（方格的）**
    - **cobwebbed（蜘蛛网的）**
    - **cracked（破裂的）**
    - **crosshatched（交叉阴影线的）**
    - **crystalline（结晶的）**
    - **dotted（点状的）**
    - **fibrous（纤维的）**
    - **flecked（有斑点的）**
    - **freckled（有雀斑的）**
    - **frilly（有褶边的）**
    - **gauzy（薄纱的）**
    - **grid（网格的）**
    - **grooved（有凹槽的）**
    - **honeycombed（蜂窝状的）**
    - **interlaced（交织的）**
    - **knitted（针织的）**
    - **lacelike（蕾丝状的）**
    - **lined（有内衬的）**
    - **marbled（大理石纹的）**
    - **matted（无光泽的）**
    - **meshed（网状的）**
    - **paisley（佩斯利涡旋花纹的）**
    - **perforated（穿孔的）**
    - **pitted（有坑洼的）**
    - **pleated（打褶的）**
    - **polka - dotted（带圆点的）**
    - **porous（多孔的）**
    - **potholed（坑洼不平的）**
    - **scaly（有鳞片的）**
    - **smeared（涂抹的）**
    - **spiralled（螺旋状的）**
    - **sprinkled（洒的）**
    - **stained（染色的）**
    - **stratified（分层的）**
    - **striped（条纹的）**
    - **studded（镶嵌的）**
    - **swirly（漩涡状的）**
    - **veined（有纹理的）**
    - **waffled（华夫饼状的）**
    - **woven（编织的）**
    - **wrinkled（有皱纹的）**
    - **zigzagged（锯齿状的）**

```



## Reference
- [paper 2013 Describing Textures in the Wild](https://arxiv.org/abs/1311.3618)
- [官网](https://www.robots.ox.ac.uk/~vgg/data/dtd/)

