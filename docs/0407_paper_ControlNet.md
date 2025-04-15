---
Title | paper ControlNet
-- | --
Created @ | `2023-06-02T07:16:30Z`
Updated @| `2025-04-15T02:57:54Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/407)

---
# ControlNet

- Control diffusion models

## Conditions

- 用来控制 `Stable Diffusion` 生成内容的 Condition 包括：
  - Canny Edge
  - M-LSD Lines
  - HED Boundary
  - User Scribbles
  - Fake Scribbles
  - Human Pose
  - Semantic Segmentation
  - Normal Map
  - Anime Line Drawing


----
<details>
<summary>不同 Conditions 的 Demo</summary>

Input | Demo
-- | -- 
Canny Edge | ![image](https://github.com/junxnone/aiwiki/assets/2216970/dcdd5a02-a35c-44b1-b6a2-b2825a9ddc42)
M-LSD Lines | ![image](https://github.com/junxnone/aiwiki/assets/2216970/d408fbf7-b4f8-4c0e-acad-cb7a05a5bc57)
HED Boundary | ![image](https://github.com/junxnone/aiwiki/assets/2216970/de32f0a5-fe3e-4430-8626-cd87a53f005d)
User Scribbles | ![image](https://github.com/junxnone/aiwiki/assets/2216970/a3676b96-7cc0-475f-b072-486236a58017)
Fake Scribbles | ![image](https://github.com/junxnone/aiwiki/assets/2216970/b6aa8a41-0ade-4ce2-a265-b880c1edd316)
Human Pose | ![image](https://github.com/junxnone/aiwiki/assets/2216970/c051e8b1-58d5-4403-a684-4499b3a392e5)
Semantic Segmentation | ![image](https://github.com/junxnone/aiwiki/assets/2216970/42d72420-e133-41d9-8d31-2704c0b686d5)
Depth | ![image](https://github.com/junxnone/aiwiki/assets/2216970/553bcdfe-f457-4bfe-a60b-1ec0d02209a5)
Normal Map | ![image](https://github.com/junxnone/aiwiki/assets/2216970/f5ff8345-c389-4afe-91e6-11d2f16dbcc5)
Anime Line Drawing | ![image](https://github.com/junxnone/aiwiki/assets/2216970/7409623f-2585-47a8-9829-9081a1de1371)

</details>



## Arch

![image](https://github.com/junxnone/aiwiki/assets/2216970/9297539c-fd83-4014-ab46-fb77c148bed9)


### Zero Convolution
- 零卷积是指卷积核中所有的权重都为零的卷积，具体是 1×1 卷积层，且权重和偏差都初始化为零 。在常规的卷积神经网络里，卷积核用于提取输入数据的特征，但零卷积因为权重全为零，若直接进行卷积操作，其结果始终是零，无法像普通卷积那样提取有用特征。
- **在ControlNet中的作用**
    - **确保训练初期模型稳定**：在ControlNet训练开始时，零卷积使得控制信号不会对生成模型的输出产生影响。因为权重为零，它在训练初期不会给大扩散模型的深层特征添加有害噪声，保护了大规模预训练的主干部分。就好比在学习新技能时，先让原本的能力稳定发挥，不受新干扰。例如在基于文本生成图像的模型中，一开始不会因新增的控制条件而产生混乱的输出。
    - **实现渐进式学习**：随着训练的进行，零卷积层的参数会逐渐增长。这让网络能够逐步学习控制信号的作用，使得控制信号和生成模型可以逐步融合。如同学习新知识，是一点一点积累，而不是一下子全部接受。比如在图像生成中，慢慢根据输入的条件图像（如边缘、姿态等）来调整生成结果。
    - **通过反向传播学习**：虽然零卷积层初始权重为零，但在反向传播过程中，梯度会传递到这些卷积层，进而更新其权重。这样，零卷积层就能根据训练数据和目标来调整，最终学会利用控制信号影响生成图像。就像从一无所知到慢慢掌握技巧，零卷积层在训练中逐渐发挥作用。 




## Reference
- paper 2023 **ControlNet** [Adding Conditional Control to Text-to-Image Diffusion Models](https://arxiv.org/abs/2302.05543) [[Code](https://github.com/lllyasviel/ControlNet/tree/main)]
