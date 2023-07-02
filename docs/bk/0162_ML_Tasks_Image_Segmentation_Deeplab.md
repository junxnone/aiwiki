-----

| Title         | ML Tasks Image Segmentation Deeplab                   |
| ------------- | ----------------------------------------------------- |
| Created @     | `2019-11-29T08:03:58Z`                                |
| Last Modify @ | `2022-12-24T12:51:35Z`                                |
| Labels        | \`\`                                                  |
| Edit @        | [here](https://github.com/junxnone/aiwiki/issues/162) |

-----

## Reference

  - [Github
    repo](https://github.com/tensorflow/models/tree/master/research/deeplab)
  - [Project - DeepLab](http://liangchiehchen.com/projects/DeepLab.html)
  - [DeepLab:
    Models](http://liangchiehchen.com/projects/DeepLab_Models.html)
  - [Blog - 一作 - Liang-Chieh (Jay) Chen](http://liangchiehchen.com/)
  - [Semantic Segmentation
    --DeepLab(1,2,3)系列总结](https://blog.csdn.net/u011974639/article/details/79148719)
  - **DeepLab V1**
      - [paper - semantic image segmentation with deep convolutional
        nets and fully connected
        CRFs](https://arxiv.org/pdf/1412.7062v3.pdf)
      - [【论文阅读】semantic image segmentation with deep convolutional nets
        and fully connected
        CRFs](https://blog.csdn.net/u011582187/article/details/80345431)
      - [Rethinking-Atrous-Convolution-for-Semantic-Image-Segmentation-1.pdf](http://web.eng.tau.ac.il/deep_learn/wp-content/uploads/2017/12/Rethinking-Atrous-Convolution-for-Semantic-Image-Segmentation-1.pdf)
      - [Code](https://bitbucket.org/deeplab/deeplab-public/src/master/)
      - [netscope - deeplab
        v1](http://ethereon.github.io/netscope/#/gist/7c54e9d23a2e84d094496bb190592fc5)
      - [netscope - Deeplab v1
        MSc](http://ethereon.github.io/netscope/#/gist/3f1050c1f12575b768ac7633986dbc8e)
      - [netscope - DeepLab v1
        LargeFOV](http://ethereon.github.io/netscope/#/gist/51dca179ed7c2b5045d45a89ce4e00f5)
  - **DeepLab V2**
      - [paper - 2017 - DeepLab: Semantic Image Segmentation with Deep
        Convolutional Nets, Atrous Convolution, and Fully Connected CRFs
        ](https://arxiv.org/pdf/1606.00915.pdf)
      - [论文阅读：《DeepLab-v2: Semantic Image Segmentation
        》](https://blog.csdn.net/qq_36165459/article/details/78340094)
      - [Code](https://bitbucket.org/aquariusjay/deeplab-public-ver2/src/master/)
      - [netscope - Deeplab v2
        VGG16](http://ethereon.github.io/netscope/#/gist/d1f1c884572ae15d7394dc37232c6216)
      - [netscope - Deeplab v2
        resnet101](http://ethereon.github.io/netscope/#/gist/231825df213d3af8c668c2870b394f4d)
  - **DeepLab V3**
      - [Rethinking Atrous Convolution for Semantic Image
        Segmentation](https://arxiv.org/pdf/1706.05587.pdf)
  - **DeepLab V3+**
      - [Encoder-Decoder with Atrous Separable Convolution for Semantic
        Image Segmentation](https://arxiv.org/pdf/1802.02611.pdf)

## Brief

  - DeepLab是Google团队一系列semantic image segmentation的paper

| \--             | DeepLabv1 | DeepLabv2 | DeepLabv3 | DeepLabv3+ |
| --------------- | --------- | --------- | --------- | ---------- |
| Backbone        | VGG-16    | ResNet    | ResNet+   | Xception   |
| Atrous Conv     | √         | √         | √         | √          |
| CRF             | √         | √         | ×         | ×          |
| ASPP            | ×         | ASPP      | ASPP+     | ASPP+      |
| Encoder-decoder | ×         | ×         | ×         | √          |

## DeepLab V1

  - 基于VGG16
      - 全连接层转为卷积
      - 最后两个池化去掉下采样
      - Conv5 的三个卷积层使用 hole 为2 的卷积
      - fc6 中hole为 4
  - **使用 `Hole Algorithm` - `atrous convolution` , 提高特征分辨率**
      - 标准卷积的平移不变性(高层次特征映射) 导致了分割时精准度不高
  - **使用 `bi-linear interpolation` 上采样**
  - **使用 CRF，提高分割边缘精度**

### Model

![image](media/4b9dc8336c8b13ff5dfd1a123bd30111271a4178.png)

### Hole Algorithm

![image](media/a7d024d01284d587d517a15712db7920b6fdda16.png)

### 条件随机场 - CRF - Conditional Random Field

  - 一个位置的像素值(label), 和周围邻居像素值(label) 相关
  - 使用 fully connected CRF , 而不是 short range CRF
  - CRF是后处理，是不参与训练的
  - CRF 导致的结果是锐化？

**Energy Function:**
![image](media/eca754468743166d139d7fdc890f1c11603b7392.png)

  - x 是像素的label
    ![image](media/13f9316ae467042e380c2153d97dfd8f9d84bb9c.png)

### Result

![image](media/a0d4bb80bbe9290c2980c3b147f96e1a1609f32f.png)

  - MSc : multi-scale
  - LargeFOV: large field-of-view

## DeepLab V2

  - 使用 Atrous Convolution 提高特征图分辨率，减少信息丢失
  - **引入 ASPP，提高多尺度能力**
  - 使用 Full Connected CRF 提高边缘精度

### Atrous Convolution

![image](media/475c804fe1a18e645a638c0cc4923ebd55580b68.png)
![image](media/ce688c6cdcb4fd0e1c68b84249ac6e8b09956f11.png)

### ASPP - Atrous Spatial Pyramid Pooling - 空洞空间卷积池化金字塔

  - 多尺度空洞卷积并行
  - 在给定的 Input Feature Map上以r=(6,12,18,24)的3×3空洞卷积并行采样
  - 各分支采样后结果最后融合到一起(通道相同，做像素加)，得到最终预测结果

-----

![image](media/2049df3cafa5af33632b8e492b576d0f27c8d7b8.png)
![image](media/ca21fa23bfb873292267a0cf6d976d15cef8627d.png)

## DeepLab V3

  - 抽象化，提出 framework，可以在其他网络中使用
  - 改进了 ASPP 模块
      - 使用 BN Layer
      - 使用GAP，克服远距离下有效权重减少的问题
      - 1 个 1x1， 3 个 3x3, rate: (6, 12, 18)
  - 引入 Resnet Block
      - 复制 ResNet最后一个 block 多个副本，级联到一起
      - 每个 block 包含3个卷积
      - 除了最后一个 block，其他 block 最后一个卷积 stride 为 2
      - 使用不同的 rate 的空洞卷积替换卷积，以维持原图大小
  - 丢弃CRF

### New ASPP

![image](media/f62b6c184a3ae5c86656b4fb6f17694492bb704b.png)

### Resnet Block

![image](media/a2ebd78b054189ccae3190b908abe7f8b8218a78.png)

## DeepLab V3+

  - 在encoder部分加入了Xception的结构减少了参数量，提高运行速度

### model 结构

![image](media/d729f9707cb8c480a8e22b557463888ac4dc181e.png)

### Encoder-Decoder with Atrous Conv

![image](media/ce2884f99d20a7b99ddc8f04322f6f2d879b076a.png)

### Depthwise separable convolution

![image](media/5179e7c79b59294d069123c3f4fb9ee14427fa61.png)
