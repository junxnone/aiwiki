---
Title | ML PerP DataAug
-- | --
Created @ | `2019-04-10T07:37:36Z`
Updated @| `2023-02-02T09:14:06Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/255)

---
# Data Augmentation 数据增强
## Reference

- [imgaug](https://github.com/aleju/imgaug)
- [NVIDIA DALI](https://docs.nvidia.com/deeplearning/sdk/dali-developer-guide/docs/quickstart.html)
- [Augmentor](https://augmentor.readthedocs.io/en/master/)
- [Data Augmentation--数据增强解决你有限的数据集](https://blog.csdn.net/u010801994/article/details/81914716) 
- [数据增强及预处理](https://blog.csdn.net/mzpmzk/article/details/80039481)
- [9.1. 图像增广 - 动手学深度学习](https://zh.d2l.ai/chapter_computer-vision/image-augmentation.html)
- [谷歌只靠AI扩增数据，就把一个模型变成SOTA，已开源](https://www.jiqizhixin.com/articles/2019-06-28-3)
- [深度学习中的数据增强](https://blog.csdn.net/qq_29462849/article/details/83241797)
- [深度学习领域的数据增强](https://www.jiqizhixin.com/articles/2019-12-04-10)

---
- [NLP Data Augmentaion](https://github.com/quincyliang/nlp-data-augmentation)

## Brief

-  **用于获取更多数据, 提高模型鲁棒性，避免过拟合**
- CV
- NLP

## CV 
- [Cutout](/Data_Augmentation_Cutout)
- [AutoAugment](/AutoAugment)
- [Copy-Pasting](/Copy_Pasting)


### 基于图像处理

类别 | 位置泛化 | 尺度泛化 | 色彩泛化 | 其他
-- | -- | -- | -- | --
几何变换( Geometric Transformations) | √ | 
翻转变换( Flipping) | √ | 
移动( Translation) |  √ | 
旋转变换/反射变换( Rotation/Reflection) |  √ | 
缩放变换( Zoom) |  √ |  √ | 
裁剪( Cropping) |  √ |  √ | 
颜色变换( Color Space) | | | √ | 
色彩抖动( color jittering )<br>- 饱和度<br>- ⾊调<br>- 亮度 | | |  √ | 
内核过滤器( Kernel Filters) <br>- 锐化<br>- 模糊 | | |  √ | 
随机擦除( Random Erasing ) | | | |  √
噪声注入( Noise Injection ) | | | |  √
图像混合-融合( Mixup ) | | | |  √
扭曲 |  | | |  √

#### Tools
- imgaug
- NVIDIA DALI
- Augmentor
- Albumentations

### 基于深度学习

- 特征空间增强( Feature Space Augmentation )
- 对抗生成( Adversarial Training )
- 基于GAN的数据增强( GAN-based Data Augmentation )
- 神经风格转换( Neural Style Transfer )


## NLP

- 同义词词典( Thesaurus )
- 随机插入( Randomly Insert )
- 随机交换( Randomly Swap )
- 随机删除( Randomly Delete )
- 语法树结构替换
- 加噪( NoiseMix )
- 情境增强( Contextual Augmentation )
- 生成对抗网络
- 回译技术( Back Translation )
- 扩句-缩句-句法
- 无监督数据扩增( Unsupervised Data Augmentation )

