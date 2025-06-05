---
Title | paper AnomalyAny
-- | --
Created @ | `2025-06-03T01:57:57Z`
Updated @| `2025-06-05T03:00:32Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/519)

---
# AnomalyAny
- Anomaly Anything
- 未在特定数据集上进行训练，因此不受可用正常样本分布的限制
- 注意力图定义了每个文本token的概率分布，这使我们能够将时间步0的最终平滑注意力图 $\bar{A}_0^j$ 用作像素级注释，以定位 $c_j$ 所描述的异常。
- 特点:
  - 测试时正常样本条件化
  - 注意力引到的异常优化
  - 提示引导的异常优化

![Image](https://github.com/user-attachments/assets/ab1b87ef-ab95-47a4-9ca4-8e95d785f267)

## Arch


![Image](https://github.com/user-attachments/assets/9f30fa21-c70e-4ce0-aec9-15520f7ebda2)

### 测试时正常样本条件化
- 生成过程中添加正常样本信息，以生成与目标正常分布一致的图像
- 从 $t_{start} = T \cdot (1-\gamma)$ 中间步骤开始，利用含噪潜在表示 $z_{t_{start}}^{normal}$ 传递来自引导正常图像 $x^{normal}$ 的损坏特征 （参数γ控制起始步骤（即添加到引导数据样本的噪声尺度），实验中设 $\gamma=0.25$ 以平衡与原始分布的相似度和促进多样化结果的推理步骤。）

### 注意力引导异常优化
- 聚合SD的注意力图，获取与 N 个 文本提示 token c 对应的注意力图集合 $A_t$ (16x16xN)
- 其中 $c_j$ 为异常类型 token
-  最大化 $c_j$ 强化异常 token $c_j$ 的激活  (通过损失函数 $L_{att}$  计算 $z_t$ 的梯度更新)
- 使用定位感知调度器缓解过渡优化问题导致的图像不真实伪影问题

### 通过提示引导优化实现精细异常生成
- 融入详细异常描述的提示引导优化方法，缓解仅基于注意力优化时常出现的不真实伪影
- 使用 GPT-4 生成 `潜在异常类型` 与 `其对应的详细描述`
  - `损坏`  - `瓶子特写，破损区域呈现粗糙不平的纹理`
- 引入 CLIP 图像生成损失函数 $L_{img}$, 使其生成更贴近详细描述
- 引入 $L_{prompt}$ 来优化提示嵌入


## Reference
- [paper - 2024.6 - Anomaly Anything: Promptable Unseen Visual Anomaly Generation](https://arxiv.org/abs/2406.01078)
- [code](https://github.com/EPFL-IMOS/AnomalyAny)
