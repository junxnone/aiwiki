-----

| Title         | ML Tasks Image Retrieval                              |
| ------------- | ----------------------------------------------------- |
| Created @     | `2022-01-21T09:08:26Z`                                |
| Last Modify @ | `2022-12-24T12:55:21Z`                                |
| Labels        | \`\`                                                  |
| Edit @        | [here](https://github.com/junxnone/aiwiki/issues/278) |

-----

## Reference

  - [ image search engine based on BoW
    model](https://github.com/willard-yuan/py-cbir-image-search-engine)
  - [retrieval
    papers](https://github.com/deepinsight/deepinsight.github.io/blob/master/_posts/deep_learning/2017-05-08-retrieval.md)
  - [图像检索重磅综述（2016年之前）](https://blog.csdn.net/TTdreamloong/article/details/80991161)
  - [图像检索与降维（一）：VLAD](https://blog.csdn.net/LiGuang923/article/details/85416407)
  - [图像检索与降维（二）：NetVLAD](https://blog.csdn.net/LiGuang923/article/details/85470289)

## Brief

  - 图像检索有基于文本的检索和基于内容的检索
      - **基于文本的检索**:
        在检索之前需要对海量的图片进行语义属性的标注，这种标注有主观性偏差，时间成本很高，而且语义属性也不能完全表达图像中的包含的丰富的信息，检索效果是有限的。
      - [CBIR](/CBIR) **基于内容的检索**:
        允许用户输入一张图片，以查找具有相同或相似内容的其他图片。CBIR的核心是使用图像的可视特征对图像进行检索。本质上讲，它是一种近似匹配技术，融合了计算机视觉、图像处理、图像理解和数据库等多个领域的技术成果，其中的特征提取和索引的建立可由计算机自动完成，避免了人工描述的主观性。
