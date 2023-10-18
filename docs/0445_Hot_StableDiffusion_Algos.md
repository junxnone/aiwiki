---
Title | Hot StableDiffusion Algos
-- | --
Created @ | `2023-10-12T06:32:04Z`
Updated @| `2023-10-18T06:15:38Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/445)

---
# Stable Diffusion 原理

- Lantent Space - 潜在空间
- Latent Diffusion Model - 潜在扩散模型
- 条件扩散

## Steps
- 创建一个可用的潜在空间表示，即训练一个 `Autoencoder`, 把图像从像素空间(Pixel Space) 转到 潜在空间表示(Laten Space)
- 对潜在空间中图片添加噪声，进行扩散过程 - Diffusion Process
- 训练一个 `CLIP` 模型 将输入 text 转换为 去噪过程条件
- 训练模型基于条件对图像去噪 `Denoising`, 获取图片潜在空间表示
  - 条件问 `text`, 即 `text2img`
  - 条件为 `img(+text)`, 即 `img2img`
- Inference
  - 输入为 `去噪条件`, 去噪获取图片潜在空间表示，经过图像解码器转换获取最终图像

![image](https://github.com/junxnone/aiwiki/assets/2216970/a84ce994-0a4c-4fe3-886d-4bfe6a9629f9)



## Reference

- [Stable Diffusion原理详解](https://developer.aliyun.com/article/1215455)
