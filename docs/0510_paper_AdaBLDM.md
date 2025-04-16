---
Title | paper AdaBLDM
-- | --
Created @ | `2025-04-10T07:20:03Z`
Updated @| `2025-04-16T03:17:46Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/510)

---
# AdaBLDM

- 论文主要介绍了一种用于生成工业缺陷样本的新算法
- 此前方法的不足:
  - 缺陷模式单一
  - 生成区域对齐不准确
  - copy-paste  过拟合问题
- 提出定制的混合潜在扩散模型（AdaBLDM），通过扩散模型在潜在空间生成缺陷样本，利用 “trimap” 掩码和文本提示进行特征编辑。
- 利用 [BLDM - Blended Latent Diffusion](https://arxiv.org/abs/2206.02779) 局部编辑图像的能力
- 该模型的图像生成推理过程分为自由扩散、编辑扩散和在线解码器自适应三个阶段。
- **trimap:** 图片背景 + 目标物体掩码 + 缺陷掩码

**此前的一些方法**

![Image](https://github.com/user-attachments/assets/955444b7-6fda-44fc-80bf-3650b47bd0be)


## Arch

![Image](https://github.com/user-attachments/assets/fa996f7e-3ca2-46ed-9b5c-a5732d2b4665)

> [!NOTE]
> ![Image](https://github.com/user-attachments/assets/1a055644-7055-4b56-a398-27791512d986)
> 参考: BLDM 架构图

![Image](https://github.com/user-attachments/assets/8aa521a7-bc2b-45fd-b820-b8d74964206f)

1. **纯去噪阶段（without editing）**：这个阶段不进行编辑操作，主要是对输入的噪声进行单纯的去噪处理。在这个过程中，算法按照一定的规则和模型结构，对噪声数据进行处理，逐步去除噪声，为后续的编辑和图像生成奠定基础。此时模型专注于对输入数据的初步处理，以得到相对干净的潜在表示，还未涉及到对缺陷等特定特征的编辑操作。
2. **潜在编辑阶段（latent editing stage）**：在这个阶段，算法开始对前一阶段得到的潜在表示进行编辑。通过使用控制三值图（trimap）和文本提示等信息，对潜在空间中的特征进行调整和修改。具体来说，会将trimap嵌入并提取特征，然后将这些特征注入到去噪解码器的相应层中，引导潜在表示朝着期望的缺陷模式进行变化，从而在潜在空间中生成具有特定缺陷特征的表示。
3. **图像编辑阶段（image editing stage）**：经过潜在编辑阶段后，得到了包含所需缺陷特征的潜在表示。在图像编辑阶段，将潜在表示转换为图像形式，并进一步对图像进行编辑。这个阶段会根据潜在表示中的信息，在图像上精确地生成缺陷区域，使得生成的图像符合文本提示和trimap所指示的物体和缺陷位置及特征要求，从而得到初步的合成缺陷图像。
4. **解码器自适应阶段（decoder adaptation stage）**：这个阶段主要是对解码器进行自适应调整。在前面的阶段中，虽然已经生成了包含缺陷的图像，但为了进一步提高图像的质量和准确性，需要对解码器进行微调。通过自适应调整，使得解码器能够更好地适应生成的潜在表示，从而生成更高质量的合成缺陷样本，以满足工业异常检测对样本质量的要求。 




## Reference

- [A Novel Approach to Industrial Defect Generation through Blended Latent Diffusion Model with Online Adaptation](https://arxiv.org/abs/2402.19330)
- [Code](https://github.com/GrandpaXun242/AdaBLDM)
