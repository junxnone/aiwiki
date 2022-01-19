---
Title | CBIR
-- | --
Create Date | `2019-02-19T10:26:05Z`
Update Date | `2022-01-19T07:08:14Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/155)

---
## Reference

- [image_retrieval - openvino_training_extensions](https://github.com/opencv/openvino_training_extensions/tree/develop/tensorflow_toolkit/image_retrieval)
- [ image search engine based on BoW model](https://github.com/willard-yuan/py-cbir-image-search-engine)
- [cbir blog](http://yongyuan.name/blog/)
- [基于内容的图像检索简介](https://shawya-sxx.github.io/blog/image-retrieval-introduction.html)
- [retrieval papers](https://github.com/deepinsight/deepinsight.github.io/blob/master/_posts/deep_learning/2017-05-08-retrieval.md)
- [DELF: DEep Local Features](https://github.com/tensorflow/models/tree/master/research/delf)
- [基于深度学习的视觉实例搜索研究进展](https://zhuanlan.zhihu.com/p/22265265)
- [awesome-cbir-papers](https://github.com/willard-yuan/awesome-cbir-papers)
- [Content-Based Image Retrieval Syetem](https://github.com/meng1994412/CBIR)
- [基于内容的图片检索CBIR简介](http://www.cvvision.cn/6963.html)
- [基于内容的图像检索技术：从特征到检索](https://zhuanlan.zhihu.com/p/46735159)
- [图像检索重磅综述（2016年之前）](https://blog.csdn.net/TTdreamloong/article/details/80991161)
- [图像检索与降维（一）：VLAD](https://blog.csdn.net/LiGuang923/article/details/85416407)
- [图像检索与降维（二）：NetVLAD](https://blog.csdn.net/LiGuang923/article/details/85470289)
- [基于内容的图像检索- baike](https://baike.baidu.com/item/%E5%9F%BA%E4%BA%8E%E5%86%85%E5%AE%B9%E7%9A%84%E5%9B%BE%E5%83%8F%E6%A3%80%E7%B4%A2/10506348?fr=aladdin)


## Brief
- CBIR - `Content-based image retrieval` - 基于内容的图像检索
- 图像检索有基于文本的检索和基于内容的检索
  - **基于文本的检索**: 在检索之前需要对海量的图片进行语义属性的标注，这种标注有主观性偏差，时间成本很高，而且语义属性也不能完全表达图像中的包含的丰富的信息，检索效果是有限的。
  - **基于内容的检索**: 允许用户输入一张图片，以查找具有相同或相似内容的其他图片。CBIR的核心是使用图像的可视特征对图像进行检索。本质上讲，它是一种近似匹配技术，融合了计算机视觉、图像处理、图像理解和数据库等多个领域的技术成果，其中的特征提取和索引的建立可由计算机自动完成，避免了人工描述的主观性。


## Algos

- [VLAD](/VLAD)
- [Triplet Network](/Triplet_Network)
- [Siamese Network](/Siamese_Network)
