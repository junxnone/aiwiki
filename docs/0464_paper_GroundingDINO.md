---
Title | paper GroundingDINO
-- | --
Created @ | `2024-04-26T07:30:30Z`
Updated @| `2024-07-26T03:03:58Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/464)

---
# Grounding DINO
- [MM-Grounding-DINO](https://github.com/open-mmlab/mmdetection/tree/main/configs/grounding_dino)


![Image](https://github.com/junxnone/aiwiki/assets/2216970/7ce9cc3d-d4c3-4dc0-ab9e-220698a0443f)



## 简介

*   **目标:** Referring Expression Comprehension (REC) 指称表达理解(特定的带形容词的object/短语理解)

## 现状

*   现有的开放集检测器架构
    *   用于提取特征的 Backbone
    *   用于增强特征的 Neck
    *   用于区域细化或检测区域的 Head
    *   特征融合一般在 Neck ，Qury Init 或Head 三种中的一种
*   现有的开放集检测器大都倾向于检测新类别




![Image](https://github.com/junxnone/aiwiki/assets/2216970/1958bc08-fa0d-4eca-8ec2-2b9de452fd48)



## 架构

*   基于 类 DETR 模型 DINO: Text Encoder + Image Encoder + Feature Enhancer + Cross-Modality Decoder
    *   Image Backbone: Swin-T/Swin-L
    *   Text Backbone: BERT-base
*   三种特征融合方法 Neck ，Qury Init 或Head
    *   Neck: 堆叠自注意力，文本-图像交叉注意力，图像-文本注意力模块的特征增强器
    *   Qury Init：语言引导的查询模式
    *   Head：带图像-文本交叉注意力，可以增强查询表示的跨模态解码器
*   Sub-sentence level representation (Attention masks)
- Language-guided Query Selection 模块的作用是从图像特征中选择与输入文本更相关的特征作为解码器查询。
  - **实现:** 通过计算图像特征和文本特征的点积，然后选择点积最大值对应的前 Nq 个索引，从而确定与输入文本相关的图像查询

![Image](https://github.com/junxnone/aiwiki/assets/2216970/9a351561-dd70-4bae-92dd-29f5aadf8dff)



## 结果

*   COCO Benchmark
    *   同样设置的话(O365 训练，COCO 测试) 比 DINO/GLIP 略好
    *   增加 Grounding data(GoldG/Cap4M/OI/RefC) 也可以获取更好的结果
*   LVIS Benchmark
    *   整体 AP 优于GLIP, 在 rare 类别表现较差
    *   通过 Cap4M 数据集的增益优于GLIP
*   ODinW Benchmark
    *   zero-shot/few-shot/full-shot 都较优
    *   full-shot: 使用 Swin-T Backbone 仍优于使用 Swin-L Backbone 的 DINO
    *   zero-shot: 优于 GLIP ，和GLIPv2 相当
*   RefCOCO/+/g
*   Ablations 消融实验: w/o Encoder Fusion/Query Selection/Text Cross Attention/Word-level Text prompt, 都有不同程度的drop


## Reference
- [Grounding DINO: Marrying DINO with Grounded Pre-Training for Open-Set Object Detection](https://arxiv.org/abs/2303.05499)
- [MM-Grounding-DINO: An Open and Comprehensive Pipeline for Unified Object Grounding and Detection](https://arxiv.org/abs/2401.02361)
