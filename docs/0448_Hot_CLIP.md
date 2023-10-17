---
Title | Hot CLIP
-- | --
Created @ | `2023-10-17T06:40:49Z`
Updated @| `2023-10-17T06:40:49Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/448)

---
# CLIP
- CLIP - `Contrastive Language–Image Pre-training` 对比语言图像预训练
- 可以学习到具有通用性的图像特征
- 可以进行零样本迁移学习



## Arch
- Text Encoer & Image Encoder
- 使用线性投影将每个编码器的表征映射到多模态的嵌入空间


![Image](https://github.com/junxnone/aiwiki/assets/2216970/99f459ce-b026-466e-a1b8-e46dfa7c38b1)




![Image](https://github.com/junxnone/aiwiki/assets/2216970/76ad9898-2d4f-4658-bfb6-8545923e2eaa)



### Image Encoder
- 作者尝试了 ResNet 和 ViT, ViT 效果更好一点



![Image](https://github.com/junxnone/aiwiki/assets/2216970/f3bd82fa-03d0-4368-b3b2-c6bdc318fc12)


### Image Encoder
- Transformer


## Zero-shot Prediction
- 将数据集中的类别标签转换为文字描述: `bird` => `a photo of a “bird"`
- 转换向量：经过2个encoder，分别输出image和text的feature embedding
- 计算cosine similarity
- 预测类别：multinomial logistic regression classifier
- [example code](https://github.com/openai/CLIP/blob/main/README.md#zero-shot-prediction)


## Reference
- [Code - OpenAI](https://github.com/OpenAI/CLIP)
- 2021.2 **CLIP** [Learning Transferable Visual Models From Natural Language Supervision](https://arxiv.org/abs/2103.00020)

