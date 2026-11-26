-----

| Title     | LM VLM StableDiffusion WebUI                          |
| --------- | ----------------------------------------------------- |
| Created @ | `2023-09-20T04:15:30Z`                                |
| Updated @ | `2026-11-26T10:21:19Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/440) |

-----

# SD 应用 webui

Stable Diffusion WebUI（AUTOMATIC1111）是 Stable Diffusion
最常用的网页界面，通过调整提示词和参数控制生成结果。模型原理见
[Stable Diffusion](https://github.com/junxnone/aiwiki/issues/402)。

  - 运行环境
  - 提示词

## 提示词

  - 分辨率提示词
  - 风格提示词
  - 提示词权重
  - 反向提示词

| 类型          | 作用        | 例子                                 |
| ----------- | --------- | ---------------------------------- |
| 内容提示词       | 描述画面主体与场景 | a cat sitting on a sofa            |
| 风格提示词       | 指定画风、质感   | oil painting, cinematic lighting   |
| 分辨率 / 质量提示词 | 提示高质量、细节  | highly detailed, 4k                |
| 提示词权重       | 强调或削弱某个词  | (cat:1.3) 表示权重 1.3                 |
| 反向提示词       | 描述不想要的内容  | blurry, low quality, extra fingers |

表中：对比结论：正向提示词决定画什么，反向提示词用来排除问题，权重用来微调重点。

## 其他参数

### 迭代步数(Steps)

  - 越多越清晰(超过某值提升有限)，时间越长
  - 20 \~ 40 ？？

去噪的迭代次数，常用 20～40 步：步数增加到一定程度后画质提升很小，而耗时按步数线性增长。

### 采样方法

  - 插画风格/细节丰富/采样快
  - 可以固定 `随机数种子(Seed)` 查看不同采样方法带来的区别

采样方法是去噪时使用的数值求解器（如 Euler、DPM++ 系列等），不同方法收敛速度与画面风格略有差别；固定 Seed
再切换采样方法，可以公平对比差异。

### 高清分辨率修复(Hires, fix)

  - 直接生成高清图像会生成一些奇怪的图(部分人物特征，重复人物)
  - 可以先生成低分辨率图片，开启 fix 功能后可以得到高分辨率图片

原因：模型训练时的分辨率固定（如 512×512），一次生成过大的图像会出现重复构图。Hires fix
先在训练分辨率附近生成，再放大并用较低强度重新去噪，补充细节。

### Refiner

  - 配合 SDXL 使用的第二个模型：基础模型先生成图像，Refiner
    在后半段去噪步骤里接手，进一步提升细节与质感；使用前需要确认模型版本支持（原文档此处标为「??」，以上为一般说明，请以实际使用为准）。

### 宽高

  - 生成图像的大小

宽高通常取 64 的倍数（因为潜空间相对原图缩小 8 倍，并经多次下采样）。分辨率越大，显存和时间消耗越高。

### 提示词引导系数 CFG Scale

  - 控制生成结果与提示词的贴合程度：

$$
\\tilde{\\epsilon}=\\epsilon(z,\\varnothing)+s\\big(\\epsilon(z,c)-\\epsilon(z,\\varnothing)\\big)
$$

其中：$s$ 为 CFG Scale，$c$ 为提示词条件，$\\varnothing$ 为空条件。$s$
越大越贴合提示词但画面可能过饱和、缺乏多样性，常用 7
左右（原文档此处标为「??」，数值为经验值）。

### 随机数种子

  - 设置随机数(大于 0 的整数)，可重复生成一致的图像，查看不同参数生成的效果
  - `-1` 为 不设置，生成图像

### Tiled Diffusion

扩展：把大图分成若干块（tile）分别去噪，再拼接，用较小显存生成超大图像。

### Tiled VAE

扩展：解码或编码大图时按块处理，降低 VAE 阶段的显存峰值，常与 Tiled Diffusion 搭配。

### ControlNet

扩展：给生成加上额外的结构条件（边缘、深度、姿态等），使画面构图可控。

### LoRA Block Weight

扩展：对 LoRA 的不同层（block）分别设置权重，精细控制 LoRA 对画面不同方面（如人物与背景）的影响，LoRA 原理见
[LoRA](https://github.com/junxnone/aiwiki/issues/406)。

### Segment Anything

扩展：用 [SAM](https://github.com/junxnone/aiwiki/issues/414)
分割出物体掩码，用于局部重绘（inpaint）。

## Reference

  - [stable-diffusion-webui -
    AUTOMATIC1111](https://github.com/AUTOMATIC1111/stable-diffusion-webui)
  - [AI绘画 Stable Diffusion Prompt
    SD文生图提示词](https://zhuanlan.zhihu.com/p/624926332)
