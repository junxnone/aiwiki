---
Title | OCR
-- | --
Create Date | `2020-05-07T06:49:15Z`
Update Date | `2022-01-19T10:24:13Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/200)

---
## Reference

- [传统OCR识别综述](https://blog.csdn.net/devcloud/article/details/103678688)
- [Awesome Scene Text](https://github.com/kurapan/awesome-scene-text)
- [awesome-deep-text-detection-recognition](https://github.com/hwalsuklee/awesome-deep-text-detection-recognition/blob/master/README.md)
- [自然场景文本检测识别技术综述](https://zhuanlan.zhihu.com/p/38655369)
- [Keyword spotting - wikipedia](https://en.wikipedia.org/wiki/Keyword_spotting)
- [scene-text-recognition](https://paperswithcode.com/task/scene-text-recognition/)
- [Scene Text Detection - Leaderboards](https://paperswithcode.com/task/scene-text-detection)
- [International Conference on Document Analysis and Recognition - ICDAR](http://icdar2019.org/)
- [基于 Tesseract 的英文文本识别](https://www.aiuai.cn/aifarm935.html)
- [Github 项目 - TextBoxes系列文字检测](https://www.aiuai.cn/aifarm961.html)
- [旷视科技姚聪博士：深度学习时代的文字检测与识别技术](https://www.sohu.com/a/279901705_418390) -- [Video - MOOC](https://mooc.yanxishe.com/course/605/learn?lessonid=2937#lesson/2937)
- [paper - 2019 - What Is Wrong With Scene Text Recognition Model Comparisons? Dataset and Model Analysis](https://arxiv.org/pdf/1904.01906v4.pdf)
- [Generic Text Recognition using Long Short-Term Memory Networks](https://blog.csdn.net/qq_27211267/article/details/85206463)
- [LSTM for ocr](https://blog.csdn.net/qq_27211267/article/details/85219396)
- [场景文本位置感知与识别的论文资源汇总](https://github.com/whitelok/image-text-localization-recognition/blob/master/README.zh-cn.md)
- [awesome-ocr](https://github.com/wanghaisheng/awesome-ocr)
- [OCR-从零开始](http://xiaofengshi.com/2019/03/13/OCR-%E4%BB%8E%E9%9B%B6%E5%BC%80%E5%A7%8B/)
- [DL OCR_Overview](http://xiaofengshi.com/2019/01/05/%E6%B7%B1%E5%BA%A6%E5%AD%A6%E4%B9%A0-OCR_Overview/)

## Brief
- OCR - Optical Character Recognition - 光学字符识别 
- HTR - Hand written Text Recognition - 手写文本识别
- STR - Scene Text Recofnition - 场景文字识别
- [Traditional OCR](/Traditional_OCR)
- [OCR History](https://junxnone.github.io/wht/tech/ocr/)  [[edit](https://github.com/junxnone/wht/issues/8)]
- **Tasks**
  - Text Detection - Text Localization - Text Segmentation
  - Text Recognition
  - Text Spotting - End to End
- [OCR Lexicon](/OCR_Lexicon)
- [OCR Metrics](/OCR_Metrics)
- **Tools**
  - [TextRecognitionDataGenerator](/TextRecognitionDataGenerator)
  - [Calamari](/Calamari)
- [OCR Augmentation](/OCR_Augmentation)


## Methods
- Detection
  - Object Detection
  - Object Segmentation
- Recognition
  - CTC-Based (CNN/RNN/Attention)
  - Seq2Seq (CNN/Attention)
- End2End
---
Name | Description
-- | --
Bottom-Up | 字符 -> `textline`
Top-Down | `text ROI`  -> 字符



## Algos

Year | Name | Description
-- | -- | --
2015 | [CRNN](/CRNN)
2016 | [CTPN](/CTPN) |
2017 | [EAST](/EAST) |
2017 | Seglink |
2017.9 |  [Sliding Convolutional](/Sliding_Convolutional) | Sliding windows + CNN + CTC
2018 | [Two-Dimensional Perspective](/CA_FCN) | CA-FCN + FPN
2018.1 | [FOTS](FOTS)
2019.10 | [CharNet](https://arxiv.org/pdf/1910.07954.pdf) |
2019.12 | [TextScanner](/TextScanner) | 

- [TextField](/TextField)
- [SCAN](/SCAN)


## 应用 & 面临的问题
- 文档文本
  - 单行文本
  - 表格
  - 特定格式 - [车票, 税单...]
- 手写字体
  - 签名
  - 试卷
  - 古籍
- 自然场景
  - 多形态文本
  - 艺术字体

# Term

Name | Description
-- | --
BDLHW | Batch/Dimension/Length/Height/Width

