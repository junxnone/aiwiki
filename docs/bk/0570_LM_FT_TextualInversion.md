-----

| Title     | LM FT TextualInversion                                |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-10-20T08:01:19Z`                                |
| Updated @ | `2026-10-20T08:01:19Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/570) |

-----

# Textual Inversion

> 本文是 [大模型微调总览](0410_LM_FT) 的深入篇，和 [DreamBooth](0405_LM_FT_DreamBooth)
> 同属扩散模型"个性化生成"技术，是比 DreamBooth 更早、更轻量的一条路线。

## 核心思路：不改模型权重，只学一个新词

DreamBooth 的做法是用罕见 token + 微调 U-Net 权重，让模型"记住"一个新主体；Textual
Inversion（Gal et al.
2022）完全不碰模型权重，只在**文本编码器的词嵌入空间**里学习一个新的嵌入向量，让这个新"虚拟词"代表目标主体或风格：

  - 给目标概念（3\~5 张图片）分配一个新的伪词（如 `<my-cat>`），这个词原本不在词表里；
  - 冻结扩散模型和文本编码器的全部参数，只把这个新词对应的嵌入向量当作可训练参数，用标准的扩散模型重建损失去优化这一个向量；
  - 训练完成后，这个新词可以像普通单词一样写进任意 prompt（比如 `"a photo of <my-cat> wearing a
    hat"`），引导模型生成包含该概念的新图像。

论文的一个重要发现是：单个词嵌入向量就足以捕捉差异很大的概念，不需要更复杂的参数化。

## 和 DreamBooth 的对比

|           | Textual Inversion             | DreamBooth                                       |
| --------- | ----------------------------- | ------------------------------------------------ |
| 改动范围      | 只新增一个词嵌入向量，模型权重完全不动           | 微调整个（或部分）U-Net 权重                                |
| 训练/存储成本   | 极低（一个向量，几 KB）                 | 更高（即便配合 [LoRA](0406_LM_FT_LoRA) 也是整组 adapter 权重） |
| 对主体细节的还原度 | 相对较弱，更适合风格/抽象概念               | 更强，更适合需要精确还原外观细节的主体                              |
| 可组合性      | 很好——新词可以和任意其他文本自由组合，像普通单词一样使用 | 相对较弱，新 token 和模型微调后的行为绑定更紧                       |

实践中两者并不互斥，也有工作尝试把两者结合（先学 Textual Inversion 的概念词，再用 DreamBooth
风格的微调进一步提升细节还原度）。

## 代码示例（Hugging Face Diffusers）

``` bash
accelerate launch textual_inversion.py \
  --pretrained_model_name_or_path="runwayml/stable-diffusion-v1-5" \
  --train_data_dir="./my_concept_images" \
  --placeholder_token="<my-cat>" --initializer_token="cat" \
  --resolution=512 --train_batch_size=1 \
  --learning_rate=5.0e-04 --max_train_steps=3000
```

## Reference

  - Gal, R. et al. (2022). An Image is Worth One Word: Personalizing
    Text-to-Image Generation using Textual Inversion.
    [arXiv:2208.01618](https://arxiv.org/abs/2208.01618)
  - [Textual Inversion - Hugging
    Face](https://huggingface.co/docs/diffusers/training/text_inversion)
  - [Textual Inversion 官方项目页](https://textual-inversion.github.io/)
  - [DreamBooth](0405_LM_FT_DreamBooth)
  - [大模型微调总览](0410_LM_FT)
