-----

| Title     | x CaFo                                                |
| --------- | ----------------------------------------------------- |
| Created @ | `2024-10-11T01:52:10Z`                                |
| Updated @ | `2024-10-11T01:52:10Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/476) |

-----

# CaFo

  - 分别利用 GPT-3/CLIP/DINO/DALL-E 从 Prompt/Generate/CacheModel 方面提升模型性能

## Arch

  - 1 利用 GPT-3 生成更丰富语义的 Prompt
  - 2 利用 DALL-E 生成 Prompt 相关的 Image
  - 3 将生成的 Image 和 Training Image 使用 CLIP & DINO 生成 Cache Model
  - 4 **Inference** 测试图片通过 CLIP & DINO 生成查询 keys, 从 Cache Model 中获取
    ensemble 结果

![image](media/bac5eeb3c29c90f66766a8e4643ac2da02131ee0.png)

![image](media/98ab9ec3e2ee73da140b06ac77bdb632ee2c5441.png)
![image](media/f82ec324def4127d7d0ca378e01b0546484452eb.png)
![image](media/d0114c9124f1c52506bdb7f9ec9eea9d1f26596b.png)

## Reference

  - [Prompt, Generate, then Cache: Cascade of Foundation Models makes
    Strong Few-shot Learners](https://arxiv.org/abs/2303.02151)
  - [Code](https://github.com/OpenGVLab/CaFo)
