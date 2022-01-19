---
Title | AutoEncoder
-- | --
Create Date | `2019-12-17T05:39:43Z`
Update Date | `2022-01-19T11:11:22Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/209)

---
## Reference

- [自动编码器（Auto Encoder）](https://blog.csdn.net/qq_26591517/article/details/80038823)
- [自动编码器—Autoencoder](https://blog.csdn.net/zb123455445/article/details/78924074)
- [几种AutoEncoder原理](https://blog.csdn.net/leida_wt/article/details/85052299)
- [变分自编码器VAE：原来是这么一回事 | 附开源代码](https://zhuanlan.zhihu.com/p/34998569)
- [Dress Segmentation with Autoencoder in Keras](https://towardsdatascience.com/dress-segmentation-with-autoencoder-in-keras-497cf1fd169a)
- [Dress_Segmentation](https://github.com/cerlymarco/MEDIUM_NoteBook/tree/master/Dress_Segmentation)
- [Keras Tutorial: Content Based Image Retrieval Using a Convolutional Denoising Autoencoder](https://www.sicara.ai/blog/2017-09-14-keras-tutorial-content-image-retrieval-convolutional-denoising-autoencoder)
- [autoencoder - apachecn/hands-on-ml-zh](https://github.com/apachecn/hands-on-ml-zh/blob/463fc172f3d32f4e905adc2eab03f0c5a97ce2bb/docs/15.%E8%87%AA%E7%BC%96%E7%A0%81%E5%99%A8.md)
- [Autoencoder自动编码器的发展](https://blog.csdn.net/sinat_37965706/article/details/100080543)
- [Deep Autoencoding Models for Unsupervised Anomaly Segmentation in Brain MR Images](https://arxiv.org/pdf/1804.04488.pdf)

## Brief
- AutoEncoder 是无监督学习
- 目的是使输出和输入相近，寻找最优编码器

![image](https://user-images.githubusercontent.com/2216970/70967990-f7277280-20d2-11ea-90fe-eeba32d77358.png)

## 用途
- 异常检测
- 数据降噪
- 降维
- 图像检索 - Image Retrieval
- 视频预测重建

## 分类
- 经典 AutoEncoder
- Regularized Autoencoders - 正则化自编码器
- Denoising AutoEncoder - DAE - 去噪自编码器
- Sparse AutoEncoder - 稀疏自动编码器
- VAE - Variational AutoEncoder - 变分自编码器
- Contractive Autoencoders - CAE - 压缩自编码器
- 卷积 AutoEncoder

## History

Date | Description
-- | --
1985 | A Learning Algorithm for Boltzmann Machines - Hinton&Sejnowski
1986 | Learning representations by back-propagating errors - Hinton<br>Learning internal representations by back propagation - Hinton
1986 | Rumelhart 提出自动编码器的概念，并将其用于高维复杂数据处理，促进了神经网络的发展
2006 | reduce the dimensionality of data with neural networks - Hinton&Salakhutdinov<br> 对原型自动编码器结构进行改进，进而产生了DAE
2008 | Extracting and Composing Robust Features with Denoising Autoencoders - Pascal Vincent team
2011 | Sparse autoencoder 
2011 | Stacked Convolutional Auto-Encoders for Hierarchical Feature Extraction
2013 | VAE
2014 | RNN Encoder-Decoder
2016 | Ladder VAE

