---
Title | paper DINO
-- | --
Created @ | `2024-10-14T09:32:21Z`
Updated @| `2024-10-15T09:54:08Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/483)

---
# DINO
- **DINO** - **D**ETR with **I**mproved de**N**oising anch**O**r boxe
- DETR 存在的问题
  - 收敛速度慢(`by decoder cross-attention` & ` instability of bipartite matching`)
  - 查询含义不明确
- 参考优化
  - **DAB-DETR** - 将位置查询明确表示为 `Dynamic Anchor boxes` 
  - **DN-DETR** - 引入噪声技术，在训练期间稳定二分匹配
  - **Deformable DETR** - 加速收敛
- End-to-End
- 对比去噪训练(contrastive denoising training) - 有助于模型避免同一目标的重复输出
- 混合查询方法初始化锚点(mixed query selection) - 更好地初始化查询


## Arch
- 对比去噪训练（Contrastive DeNoising Training）
- 混合查询选择（Mixed Query Selection）
- 二次预测（Look Forward Twice）


![image](https://github.com/user-attachments/assets/8c817099-5c6d-479c-8c5c-593cb6385fb9)

### Contrastive DeNoising Training
- 生成两种类型的对比去噪（CDN）查询：正样本查询和负样本查询
- 内正方形中的点表示正样本查询
- 内正方形和外正方形之间的负样本查询
- 通过噪声尺度( $\lambda_{1} < \lambda_{2}$ )控制
- 能够更好的抑制重复的框
- 提升检测小目标能力

![image](https://github.com/user-attachments/assets/57ce6d2e-d0c9-406b-befd-f13b0f7ae5c8)


### Mixed Query Selection
- DETR & DN-DETR 使用静态嵌入作为解码器查询 图5(a)
  - 学习位置查询，内容查询设置为 0 的向量
- Deformable DETR 
  - 学习 位置查询与内容查询
  - two-stage: 选择 Top K Encoder Feature 增强查询 图 5(b)
- DINO 使用与所选 top - K 特征相关的位置信息初始化锚框，内容查询保持可学习，避免所选特征对解码器的误导。

![image](https://github.com/user-attachments/assets/2730b1ea-c091-4077-803e-757c3a58d7a5)


### Look Forward Twice
- 根据 `Deformable DETR` 的一次预测方法，提出二次预测
- 即层 i 的参数受层 i 和层 (i + 1) 的损失影响，通过使用下一层的输出监督当前层的最终框，提高预测框的精度
- 即优化初始化框 $b_{i - 1}$ ，也优化框偏移量 $\Delta b_{i}$



![image](https://github.com/user-attachments/assets/da6ee827-a429-4347-8142-fb9853de36bd)




## Reference
- [End-to-End Object Detection with Transformers](https://arxiv.org/abs/2005.12872)
- [DINO: DETR with Improved DeNoising Anchor Boxes for End-to-End Object Detection](https://arxiv.org/abs/2203.03605)
- [DAB-DETR: Dynamic Anchor Boxes are Better Queries for DETR](https://arxiv.org/abs/2201.12329)
- [DN-DETR: Accelerate DETR Training by Introducing Query DeNoising](https://arxiv.org/abs/2203.01305)
- [Deformable DETR: Deformable Transformers for End-to-End Object Detection](https://arxiv.org/abs/2010.04159)
