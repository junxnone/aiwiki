---
Title | Hot StableDiffusion webui
-- | --
Created @ | `2023-09-20T04:15:30Z`
Updated @| `2023-09-21T03:09:36Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/440)

---
# SD 应用 webui
- 运行环境
- 提示词


## 提示词
- 分辨率提示词
- 风格提示词
- 提示词权重
- 反向提示词

## 其他参数
### 迭代步数(Steps)

- 越多越清晰(超过某值提升有限)，时间越长
- 20 ~ 40 ？？


### 采样方法
- 插画风格/细节丰富/采样快
- 可以固定 `随机数种子(Seed)` 查看不同采样方法带来的区别


### 高清分辨率修复(Hires, fix)
- 直接生成高清图像会生成一些奇怪的图(部分人物特征，重复人物)
- 可以先生成低分辨率图片，开启 fix 功能后可以得到高分辨率图片


### Refiner
- ??

### 宽高
- 生成图像的大小

### 提示词引导系数 CFG Scale
- ??


### 随机数种子
- 设置随机数(大于 0 的整数)，可重复生成一致的图像，查看不同参数生成的效果
- `-1` 为 不设置，生成图像


### Tiled Diffusion


### Tiled VAE

### ControlNet

### LoRA Block Weight

### Segment Anything



## Reference
- [stable-diffusion-webui - AUTOMATIC1111](https://github.com/AUTOMATIC1111/stable-diffusion-webui)
- [AI绘画 Stable Diffusion Prompt SD文生图提示词](https://zhuanlan.zhihu.com/p/624926332)
