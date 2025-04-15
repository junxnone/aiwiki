-----

| Title     | paper ControlNet                                      |
| --------- | ----------------------------------------------------- |
| Created @ | `2023-06-02T07:16:30Z`                                |
| Updated @ | `2025-04-15T02:57:54Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/407) |

-----

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

-----

<details>
<summary>不同 Conditions 的 Demo</summary>

| Input                 | Demo                                                         |
| --------------------- | ------------------------------------------------------------ |
| Canny Edge            | ![image](media/53f7925c474199a5e6c9c3a77e2d9a6a995af3ae.png) |
| M-LSD Lines           | ![image](media/e8b0d7aaf19e68deaf4cd9a5ab8e5cff49982e74.png) |
| HED Boundary          | ![image](media/c7c7feb286a1af7c197ee9b1130ccd7504774ca3.png) |
| User Scribbles        | ![image](media/894d46e0698519ef99b32d25bb950c5c5abb8c00.png) |
| Fake Scribbles        | ![image](media/40ce21da93f992a2678d5d4a8ef13343f0ed3e07.png) |
| Human Pose            | ![image](media/73d82a1573ae2f153e93f460af2c157fee164dd4.png) |
| Semantic Segmentation | ![image](media/28c892b0cbcfc06b1c2b056702e281d32f137dbf.png) |
| Depth                 | ![image](media/fe120fd79f1beda08a0532f4e62c92b4ff57c2a3.png) |
| Normal Map            | ![image](media/7f866dc9b774a411381107e205bdb79321822f7d.png) |
| Anime Line Drawing    | ![image](media/5544b107fc412c0b81045d506b7beb680ef2f04c.png) |

</details>

## Arch

![image](media/cff6e50226b23ea9b86d6f7a5064b3436acae164.png)

### Zero Convolution

  - 零卷积是指卷积核中所有的权重都为零的卷积，具体是 1×1 卷积层，且权重和偏差都初始化为零
    。在常规的卷积神经网络里，卷积核用于提取输入数据的特征，但零卷积因为权重全为零，若直接进行卷积操作，其结果始终是零，无法像普通卷积那样提取有用特征。
  - **在ControlNet中的作用**
      - **确保训练初期模型稳定**：在ControlNet训练开始时，零卷积使得控制信号不会对生成模型的输出产生影响。因为权重为零，它在训练初期不会给大扩散模型的深层特征添加有害噪声，保护了大规模预训练的主干部分。就好比在学习新技能时，先让原本的能力稳定发挥，不受新干扰。例如在基于文本生成图像的模型中，一开始不会因新增的控制条件而产生混乱的输出。
      - **实现渐进式学习**：随着训练的进行，零卷积层的参数会逐渐增长。这让网络能够逐步学习控制信号的作用，使得控制信号和生成模型可以逐步融合。如同学习新知识，是一点一点积累，而不是一下子全部接受。比如在图像生成中，慢慢根据输入的条件图像（如边缘、姿态等）来调整生成结果。
      - **通过反向传播学习**：虽然零卷积层初始权重为零，但在反向传播过程中，梯度会传递到这些卷积层，进而更新其权重。这样，零卷积层就能根据训练数据和目标来调整，最终学会利用控制信号影响生成图像。就像从一无所知到慢慢掌握技巧，零卷积层在训练中逐渐发挥作用。

## Reference

  - paper 2023 **ControlNet** [Adding Conditional Control to
    Text-to-Image Diffusion Models](https://arxiv.org/abs/2302.05543)
    \[[Code](https://github.com/lllyasviel/ControlNet/tree/main)\]
