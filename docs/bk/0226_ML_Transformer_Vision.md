-----

| Title     | ML Transformer Vision                                 |
| --------- | ----------------------------------------------------- |
| Created @ | `2021-01-27T06:53:48Z`                                |
| Updated @ | `2026-11-19T09:38:50Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/226) |

-----

# Vision

Transformer 最初用于 NLP，2020
年起被引入计算机视觉：从分类（[ViT](/0223_ML_Transformer_ViT)）扩展到检测（DETR）、分割、车道线检测（LSTR）等任务。核心做法是把图像表示成
token 序列，再用 Self-Attention 建模全局关系。

## CNN Vs Transformer

| CNN Vs Transformer | 不同点                                               |
| ------------------ | ------------------------------------------------- |
| CNN                | 参数共享, Local 信息聚合，平移等变性等归纳偏置，小数据上更易训练              |
| Transformer        | 全局感受野, Global 信息聚合，归纳偏置弱，依赖大数据/强正则，$`O(n^2)`$ 复杂度 |

| Name                                   | Description                                                                    | CNN | Transformer |
| -------------------------------------- | ------------------------------------------------------------------------------ | --- | ----------- |
| [ViT](/0223_ML_Transformer_ViT)        | 图像切 patch 直接送入 Transformer Encoder                                             | ❌   | ✅           |
| DETR                                   | CNN backbone + Transformer Encoder-Decoder，object query 直接预测目标集合（匈牙利匹配，无需 NMS） | ✅   | ✅           |
| [BoTNet](/0228_ML_Transformer_BT)      | ResNet 最后 3 个 block 的 $`3\times3`$ 卷积换成 MHSA                                   | ✅   | ✅           |
| [T2T-ViT](/0227_ML_Transformer_T2TViT) | Tokens-to-Token 渐进聚合局部 token + Deep-Narrow backbone                            | ❌   | ✅           |
| [DeiT](/0253_ML_Transformer_DeiT)      | 只用 ImageNet 训练，Distillation Token 蒸馏                                           | ❌   | ✅           |
| [TNT](/0360_ML_Transformer_TiT)        | Inner / Outer 嵌套 Transformer，建模 patch 内外关系                                     | ❌   | ✅           |

## Classification

### 核心问题

  - ViT 数据需求大 → DeiT（训练策略 + 蒸馏）
  - ViT 缺乏局部结构建模 → T2T-ViT、TNT、BoTNet（引入卷积）
  - 全局注意力 $`O(n^2)`$，高分辨率代价大 → Efficient Attention（见 [Efficient
    Attention](/0225_ML_Transformer_EfficientAttention)），以及后续的 Swin
    等基于窗口的层次化设计

### Models

  - ViT
  - T2T-ViT
  - DeiT
  - TNT
  - BoTNet
  - W/ Efficient Attention
      - [Linformer](/0224_ML_Transformer_Linformer)
      - Routing Transformer
      - Sinkhorn Transformer
      - Nystromformer

### OpenSource Code

  - **timm** release with pretrained weight
  - **vit-pytorch**
      - module
          - vit\_pytorch =\> `vanilla vit`
          - distill
              - DistillableViT
          - t2t
              - T2TViT
          - efficient =\> 自定义的 Transformer module
              - Linformer
              - Nystromformer

## Detection

  - DETR：用 Transformer Encoder-Decoder 把检测变成集合预测，去除 anchor 与
    NMS；缺点是收敛慢、小目标效果较差（后续有 Deformable DETR 等改进）

## Lane Detection

  - LSTR：用 Transformer 预测车道线的形状参数

## Reference

  - 2021-01 A Survey on Visual Transformer
    \[[Paper](https://arxiv.org/pdf/2012.12556.pdf)\]
    \[[Note](https://github.com/junxnone/tech-io/issues/926)\]
  - 2021-01 Transformers in Vision: A Survey
    \[[Paper](https://arxiv.org/pdf/2101.01169.pdf)\]
    \[[Note](https://github.com/junxnone/tech-io/issues/927)\]
  - [vision\_transformer -
    google-research](https://github.com/google-research/vision_transformer)
  - [DETR](https://github.com/facebookresearch/detr)
  - [LSTR: Lane Shape Prediction with
    Transformers](https://arxiv.org/abs/2011.04233) -
    [Github](https://github.com/liuruijin17/LSTR)
  - [vit-pytorch](https://github.com/lucidrains/vit-pytorch)
      - [x-transformers](https://github.com/lucidrains/x-transformers)
      - [linformer](https://github.com/lucidrains/linformer)
  - [self-attention-cv -
    The-AI-Summer](https://github.com/The-AI-Summer/self-attention-cv)
