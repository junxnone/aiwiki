---
Title | ML Transformer Vision
-- | --
Created @ | `2021-01-27T06:53:48Z`
Last Modify @| `2022-12-24T15:49:03Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/226)

---
# Transformer 在视觉方面的应用

## Reference
- 2021-01 A Survey on Visual Transformer [[Paper](https://arxiv.org/pdf/2012.12556.pdf)]  [[Note](https://github.com/junxnone/tech-io/issues/926)]
- 2021-01 Transformers in Vision: A Survey [[Paper](https://arxiv.org/pdf/2101.01169.pdf)]  [[Note](https://github.com/junxnone/tech-io/issues/927)]
- [vision_transformer - google-research](https://github.com/google-research/vision_transformer)
- [DETR](https://github.com/facebookresearch/detr)
- [LSTR: Lane Shape Prediction with Transformers](https://arxiv.org/abs/2011.04233) - [Github](https://github.com/liuruijin17/LSTR)
- [vit-pytorch](https://github.com/lucidrains/vit-pytorch)
  - [x-transformers](https://github.com/lucidrains/x-transformers)
  - [linformer](https://github.com/lucidrains/linformer)
- [self-attention-cv - The-AI-Summer](https://github.com/The-AI-Summer/self-attention-cv)

## Brief
- Classification

## CNN Vs Transformer

CNN Vs Transformer | 不同点
-- | --
CNN | 参数共享, Local 信息聚合
Transformer | 全局感受野, Global 信息聚合

Name | Description | CNN | Transformer 
-- | -- | -- | --
ViT |  | ❌ | ✅ 
DETR|  | ✅  | ✅ 
BoTNet |  | ✅  | ✅ 
T2T-ViT |  | ❌ | ✅  
DeiT |  | ❌ | ✅  

## Classification

### Models

-  ViT
- T2T-ViT
- DeiT
- W/ Efficient Attention
  - Linformer
  - Routing Transformer
  - Sinkhorn Transformer
  - Nystromformer

### OpenSource Code 
- **timm** release with pretrained weight
- **vit-pytorch**
  - module
    -  vit_pytorch => `vanilla vit`
    - distill 
      - DistillableViT
    - t2t
      - T2TViT
    - efficient => 自定义的 Transformer module
      - Linformer
      - Nystromformer

