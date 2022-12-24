---
Title | ML Transformer T2T-ViT
-- | --
Created @ | `2021-02-18T05:34:31Z`
Last Modify @| `2022-12-24T15:49:29Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/227)

---
## Reference
- 2021-01 **[T2T-ViT]** Tokens-to-Token ViT: Training Vision Transformers from Scratch on ImageNet [[Paper](https://arxiv.org/abs/2101.11986)] [[Code](https://github.com/yitu-opensource/T2T-ViT)] 
- [vit_pytorch.t2t  - lucidrains](https://github.com/lucidrains/vit-pytorch/blob/main/vit_pytorch/t2t.py)

## Brief
- ViT 不能学习到局部特征
  - 比 CNN 需要更多data
- ViT backbone 冗余的 Attention 设计导致 feature 不够丰富，训练困难

**如下图, 分析了 `ResNet & ViT & T2T-ViT` 学习到的 `low level feature`**
- 绿色为 `low level structure features` (edges/lines)
- 红色为 ViT 中 学习到的 `invalid feature` (zeros/large value)

![image](https://user-images.githubusercontent.com/2216970/109020575-094c6a00-76f5-11eb-8487-aeda5214e8fc.png)

## Arch
- Image Soft Split to Tokens
- T2T Module x 2
- Concat Class Token + Position Embedding
- T2T-ViT

![image](https://user-images.githubusercontent.com/2216970/108311515-1eeefa80-71f0-11eb-8940-25171622cb84.png) 
 

## Tokens to Token / T2T Module

Steps | Formula | Description
-- | :-- | --
Re-structurization | ![image](https://user-images.githubusercontent.com/2216970/109027415-b9bd6c80-76fb-11eb-92de-479f77cec5c7.png) <br> ![image](https://user-images.githubusercontent.com/2216970/109027635-f8532700-76fb-11eb-9f84-398121b2e602.png) | 
Soft Split|  Image : (kernel, strde, padding) = (7, 4, 2)<br>  Tokens : (kernel, strde, padding) = (3, 2, 1)
 
![image](https://user-images.githubusercontent.com/2216970/108311565-38904200-71f0-11eb-8bba-3a3fb1fdeb7f.png)

## Backbone
- 测试了几种模式最终得出结论 : **Deep-Narrow 模式提升性能更多(减少冗余与计算复杂度，提升特征丰富性)**
  - Dense Connection 类似于DenseNet
  - **Deep-narrow** vs shallow-wide结构 类似于Wide-ResNet一文的讨论
  - Channel Attention 类似SENet
  - More Split Head 类似ResNeXt
  - Ghost操作 类似GhostNet
