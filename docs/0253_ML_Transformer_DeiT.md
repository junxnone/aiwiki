---
Title | ML Transformer DeiT
-- | --
Created @ | `2021-02-18T07:42:25Z`
Updated @| `2026-11-19T09:39:00Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/253)

---
# DeiT

DeiT（Data-efficient image Transformers）只用 ImageNet-1k 训练（无需 [ViT](/0223_ML_Transformer_ViT) 依赖的 JFT-300M 预训练），在单台 8 GPU 机器上约 3 天即可训得有竞争力的纯 Transformer 分类模型。关键技术是：强数据增强/正则化的训练配方 + 通过 Attention 做知识蒸馏的 **Distillation Token**。

## Motivation

- 背景/存在的问题
  - ViT 很难 Training，需要资源巨大
  - 需要 Google 内部数据集 JFT-300M pretrain
- 做了什么尝试/分别有什么效果
  - 重新设计训练策略（Rand-Augment、Mixup、CutMix、Random Erasing、Stochastic Depth、Repeated Augmentation 等）
  - +KD（Knowledge Distillation）
  - 相比 ViT 不需要在 JFT-300M 上 pretrain，训练资源减少

## Knowledge Distillation

- **经典**
  - **Soft**: softmax output vector
  - **Hard**: output label with maximum scores
- **Distillation Token**
  - 类似于 `Class Token`，与 patch token 一起输入网络，通过 self-attention 与其它 token 交互
  - 最后一层的输出对应 teacher 的预测目标，`Class Token` 的输出对应真实标签

设 $`Z_s`$、$`Z_t`$ 为 student / teacher 的 logits，$`\psi`$ 为 softmax，$`y`$ 为真实标签，$`y_t = \arg\max_c Z_t(c)`$：

$$
\mathcal{L}_{soft} = (1-\lambda)\,\mathcal{L}_{CE}(\psi(Z_s), y) + \lambda\tau^2\,\mathrm{KL}\big(\psi(Z_s/\tau),\, \psi(Z_t/\tau)\big)
$$

$$
\mathcal{L}_{hard} = \tfrac{1}{2}\,\mathcal{L}_{CE}(\psi(Z_s), y) + \tfrac{1}{2}\,\mathcal{L}_{CE}(\psi(Z_s), y_t)
$$

符号说明：

- $`\mathcal{L}_{CE}`$ 是交叉熵损失；$`\mathrm{KL}(p, q)`$ 是 KL 散度，衡量两个分布的差异，值越小说明 student 的分布越接近 teacher
- $`\lambda \in [0,1]`$ 平衡真实标签损失和蒸馏损失
- $`\tau`$ 是温度：logits 除以 $`\tau`$ 后再 softmax，$`\tau>1`$ 时分布更平滑，能保留 teacher 对"非正确类别"的相对偏好（dark knowledge）；乘上 $`\tau^2`$ 是为了抵消温度使梯度变小的影响，让两项损失量级可比
- soft：student 拟合 teacher 的**完整概率分布**；hard：直接把 teacher 的 $`\arg\max`$ 当作第二个"真实标签" $`y_t`$，没有 $`\lambda`$、$`\tau`$ 这两个超参，权重固定各占一半

**为什么 hard 更好**：teacher 的类别预测有时与真实标签不同（例如被强数据增强裁剪后目标已不在图中），hard label 会随增强后的图像动态变化，能纠正这种不一致；而且形式简单无需调超参。

**Distillation Token 的作用**：两个损失分别作用在两个 token 的输出上——`Class Token` 的输出用 $`\mathcal{L}_{CE}(\psi(Z_s), y)`$，`Distillation Token` 的输出 $`Z_s`$ 用 $`\mathcal{L}_{CE}(\psi(Z_s), y_t)`$，二者共用同一套权重，只是目标不同，所以训练后两个 token 的表示相似但不完全一致，推理时取平均。

论文最终使用 hard distillation，效果优于 soft distillation。

## Diff with ViT

Name | ViT | DeiT
-- | -- | --
训练策略 | Pretrain on JFT-300M<br> Fine-tune on ImageNet | Training on ImageNet
Head | MLP | Linear Classifier
Distillation Token | :x: | ✅

## Arch
- DeiT 的不同重量级的结构 DeiT-tiny/DeiT-Small/Deit-Base，网络结构与 ViT 基本一致，仅增加 distillation token
- Inference 时 模型输出值 取 `(Class Token + Distillation Token) / 2 `

Name | Layers | Dim | Heads | Params | ImageNet Top-1 | w/ Distillation
-- | -- | -- | -- | -- | -- | --
DeiT-Ti | 12 | 192 | 3 | 5M | 72.2 | 74.5
DeiT-S | 12 | 384 | 6 | 22M | 79.8 | 81.2
DeiT-B | 12 | 768 | 12 | 86M | 81.8 | 83.4

![image](https://user-images.githubusercontent.com/2216970/114993508-78149b00-9ece-11eb-877e-13d4cb57062a.png) | ![image](https://user-images.githubusercontent.com/2216970/115177982-e2158600-a102-11eb-8628-4448d9460a71.png)
-- | --

## Evaluation
- **Evaluation 1: Teacher Model**
  - CNN 网络 比 Transformer 作为 `Teacher Model` 取得了更好的性能
  - **Teacher Model**:  `RegNetY-16GF` 和 DeiT 同样的 `Data` & `Aug` 
  - 解释：student 可以从 CNN teacher 继承归纳偏置（局部性等）
- **Evaluation 2: soft vs hard/class vs distill**
  - `hard distillation` > `soft distillation` 
  - `class + distillation` > `distill emedding` > `class embedding`
- **Evaluation 3: 结果差异**
  - 预测结果不同的样本在整个样本中的比例(横坐标和纵坐标一致, 做对比)
  - `class+distill` 和 CNN/DeiT(no distillation) 差异差不多
- **Evaluation 4: Training**
  - Distillation Token 在 一定的 training epochs 后 仍然能够提升(相比于 `no distillation`/`soft distillation`)
- **Evaluation 5: Transfer learning**
  - Transfer learning 相比 VIT 有部分提升
- **Evaluation 6: Ablation**
  - `optimizer & augmentation & regularization` `@pre-training/fine-tuning`  
  - `Rand-Augment & AutoAug & Mixup & CutMix`
  - `Erasing & Stoch. Depth & Repeated Aug & Dropout & Exp. Moving Avg`

Number | Evaluation
-- | --
1 | ![image](https://user-images.githubusercontent.com/2216970/114998409-83b69080-9ed3-11eb-856e-4309e44fc5be.png)
2 | ![image](https://user-images.githubusercontent.com/2216970/115174196-6237ed80-a0fb-11eb-984e-d600b5f22090.png)
3 | ![image](https://user-images.githubusercontent.com/2216970/115177266-6ebf4480-a101-11eb-98fe-e5b4ad1f35ec.png)
4 | ![image](https://user-images.githubusercontent.com/2216970/115178342-a929e100-a103-11eb-8fe3-6c003aa6e54a.png)
5 | ![image](https://user-images.githubusercontent.com/2216970/115178510-02921000-a104-11eb-85d3-a60135979a47.png)
6 | ![image](https://user-images.githubusercontent.com/2216970/115185008-93231d00-a111-11eb-881a-2ccad351e6b2.png)

## Tricks
- [deit issues - facebookresearch - deit - 45) show that they were not using the distillation signal and doing a classic fine-tuning

## Reference
- 2020-12 **[DeiT]** Training data-efficient image transformers & distillation through attention [[Paper](https://arxiv.org/abs/2012.12877)] [[Code](https://github.com/facebookresearch/deit)]
- [timm code](https://github.com/rwightman/pytorch-image-models/blob/e8a64fb88108b592da192e98054095b1ee25e96e/timm/models/vision_transformer.py#L242)

