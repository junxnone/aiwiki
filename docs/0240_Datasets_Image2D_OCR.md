---
Title | Datasets Image2D OCR
-- | --
Created @ | `2020-05-07T11:01:54Z`
Updated @| `2026-11-11T09:37:06Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/240)

---
# OCR 文字检测与识别数据集

OCR 数据集按任务分为文字检测（Text Detection/Localization）、文字识别（Text Recognition，裁剪单词/单行图像）、端到端（Spotting）和手写识别（HTR）。按文字形态又分规则文本（Regular）与不规则文本（Irregular，弯曲/透视）。本文整理常用数据集，并保留原有全部链接。总入口见 [Datasets Image2D](0018_Datasets_Image2D)，相关的检测类背景见 [Object Detection](0237_Datasets_Image2D_Detection)。

> 规模数字多数来自原文或官网，标"（待核实）"的为未逐项核对的数字。

## 一、识别基准分类

识别论文常用的评测集分类（训练通常用合成数据 MJSynth + SynthText）：

类别 | 数据集 | 说明
-- | -- | --
Regular Text | IIIT5K-Words（IIIT） | 规则文本，裁剪词图，见下文
Regular Text | [IC13 - ICDAR 2013](http://dagdata.cvc.uab.es/icdar2013competition/) | 水平文本
Regular Text | [SVT - Street View Text](http://tc11.cvc.uab.es/datasets/SVT_1) | 街景文字
Irregular Text | [IC15 - ICDAR 2015](https://rrc.cvc.uab.es/) | 偶然拍摄场景，透视/低分辨率
Irregular Text | SVTP | 透视变形的街景文字
Irregular Text | CUTE | 弯曲文字
HTR（手写） | [IAM On-Line Handwriting Database](http://www.fki.inf.unibe.ch/databases/iam-on-line-handwriting-database) | 在线手写

## 二、真实数据集 / 合成数据集

类型 | 数据集 | 说明
-- | -- | --
Real | [CASIA Online and Offline Chinese Handwriting Databases](http://www.nlpr.ia.ac.cn/databases/handwriting/Home.html) | 中文在线/离线手写
Real | [COCO Text](https://bgshih.github.io/cocotext/) | 基于 COCO 图像的文字标注
Synthetic | [TextRecognitionDataGenerator](https://github.com/Belval/TextRecognitionDataGenerator/) | 文字识别合成数据生成工具

## 三、ICDAR 系列（Robust Reading 竞赛）

数据集 | 描述 | 竞赛论文
-- | -- | --
[ICDAR 2015](http://rrc.cvc.uab.es/) | 1000 张训练图，500 张测试图 | [paper](http://rrc.cvc.uab.es/files/Robust-Reading-Competition-Karatzas.pdf) [![link](https://www.lds.org/bc/content/shared/content/images/gospel-library/manual/10735/paper-icon_1150845_tmb.jpg)](http://rrc.cvc.uab.es/files/Robust-Reading-Competition-Karatzas.pdf)
[ICDAR 2013](http://dagdata.cvc.uab.es/icdar2013competition/) | 229 张训练图，233 张测试图 | [paper](http://dagdata.cvc.uab.es/icdar2013competition/files/icdar2013_competition_report.pdf) [![link](https://www.lds.org/bc/content/shared/content/images/gospel-library/manual/10735/paper-icon_1150845_tmb.jpg)](http://dagdata.cvc.uab.es/icdar2013competition/files/icdar2013_competition_report.pdf)
[ICDAR 2011](http://robustreading.opendfki.de/trac/) | 229 张训练图，255 张测试图 | [paper](http://www.iapr-tc11.org/archive/icdar2011/fileup/PDF/4520b491.pdf) [![link](https://www.lds.org/bc/content/shared/content/images/gospel-library/manual/10735/paper-icon_1150845_tmb.jpg)](http://www.iapr-tc11.org/archive/icdar2011/fileup/PDF/4520b491.pdf)
[ICDAR 2005](http://www.iapr-tc11.org/mediawiki/index.php/ICDAR_2005_Robust_Reading_Competitions) | 1001 张训练图，489 张测试图 | [paper](http://www.academia.edu/download/30700479/10.1.1.96.4332.pdf) [![link](https://www.lds.org/bc/content/shared/content/images/gospel-library/manual/10735/paper-icon_1150845_tmb.jpg)](http://www.academia.edu/download/30700479/10.1.1.96.4332.pdf)
[ICDAR 2003](http://www.iapr-tc11.org/mediawiki/index.php/ICDAR_2003_Robust_Reading_Competitions) | 181 张训练图，251 张测试图（单词级与字符级） | [paper](http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.332.3461&rep=rep1&type=pdf) [![link](https://www.lds.org/bc/content/shared/content/images/gospel-library/manual/10735/paper-icon_1150845_tmb.jpg)](http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.332.3461&rep=rep1&type=pdf)

（论文图标为原文外部图片，原样保留，若图片失效不影响链接。）

## 四、其他数据集（按年份倒序）

数据集 | 年份 | 规模与标注 | 任务 | 下载/其他
-- | -- | -- | -- | --
[MLT 2017](http://rrc.cvc.uab.es/?ch=8&com=introduction) | 2017 | 7200 训练、1800 验证图；框、转写、文种标注 | 文字检测、文种识别 | -
[COCO-Text（Cornell CVG）](http://vision.cornell.edu/se3/coco-text/) | 2016 | 63,686 张图，173,589 个文字实例，3 种细粒度属性 | 文字定位与识别 | [COCO-Text API](https://github.com/andreasveit/coco-text)
[Synthetic Word Dataset（Oxford VGG，MJSynth）](http://www.robots.ox.ac.uk/~vgg/data/text/) | 2014 | 900 万张图，覆盖 9 万英文单词 | 文字识别、分割 | [download](http://www.robots.ox.ac.uk/~vgg/data/text/mjsynth.tar.gz)
[IIIT 5K-Words](http://cvit.iiit.ac.in/projects/SceneTextUnderstanding/IIIT5K.html) | 2012 | 5000 张图，来自场景文字与 born-digital（2k 训练 / 3k 测试）；裁剪词图，不区分大小写标签 | 文字识别 | [download](http://cvit.iiit.ac.in/projects/SceneTextUnderstanding/IIIT5K-Word_V3.0.tar.gz)
[StanfordSynth](http://cs.stanford.edu/people/twangcat/#research) | 2012 | 62 类单字符小图（0-9、a-z、A-Z） | 文字识别 | [download](http://cs.stanford.edu/people/twangcat/ICPR2012_code/syntheticData.tar)
[MSRA-TD500](http://www.iapr-tc11.org/mediawiki/index.php/MSRA_Text_Detection_500_Database_(MSRA-TD500)) | 2012 | 500 张自然图（分辨率 1296x864 至 1920x1280），中英文或混合 | 文字检测 | -
[Street View Text (SVT)](http://tc11.cvc.uab.es/datasets/SVT_1) | 2010 | 350 张高分辨率图（平均 1260x860；100 训练 / 250 测试），仅单词级框，不区分大小写标签 | 文字定位 | -
[KAIST Scene Text](http://www.iapr-tc11.org/mediawiki/index.php/KAIST_Scene_Text_Database) | 2010 | 3000 张室内外含文字场景；韩文、英文（数字）及混合 | 定位、分割、识别 | -
[Chars74k](http://www.ee.surrey.ac.uk/CVSSP/demos/chars74k/) | 2009 | 7.4 万+ 张图，含自然图与合成字符；62 类单字符 | 文字识别 | -

## 五、其他资源链接（原文保留）

数据集 | 备注
-- | --
[IC03](http://www.iapr-tc11.org/mediawiki/index.php/ICDAR_2003_Robust_Reading_Competitions) | 即 ICDAR 2003
[Total-Text - ICDAR 2017](http://www.cs-chan.com/source/ICDAR2017/totaltext.zip) | 弯曲文字检测数据集，详见 Reference 中 Total-Text-Dataset 仓库
[CTW - Chinese Text in the Wild](https://ctwdataset.github.io/) | 中文街景文字，字符级标注
[RCTW-17 - Reading Chinese Text in the Wild](http://mclab.eic.hust.edu.cn/icdar2017chinese/dataset.html) | ICDAR 2017 中文文字竞赛
[ICPR MWI 2018 挑战赛](https://tianchi.aliyun.com/competition/entrance/231651/introduction) | 天池比赛
[Google FSNS（谷歌街景文本数据集）](http://rrc.cvc.uab.es/?ch=6&com=downloads) | 法国街景路牌文字
[COCO-TEXT](https://vision.cornell.edu/se3/coco-text-2/) / [++](https://bgshih.github.io/cocotext/) | COCO-Text 官方页与 v2
[Synthetic Word Dataset](http://www.robots.ox.ac.uk/~vgg/data/text/#sec-synth) | 同上文 MJSynth
Synthetic Data for Text Localisation | 即 SynthText（VGG）
Caffe-ocr 中文合成数据 | 中文合成识别数据
[MSRA-TD500](http://www.iapr-tc11.org/mediawiki/index.php/MSRA_Text_Detection_500_Database_(MSRA-TD500)) | 同上文
UW3 / UW3α / DTA19 | 文档图像类数据集（无链接，待核实）

## 选择建议

- 文字识别训练：MJSynth + SynthText 合成数据；评测用 IIIT5K、SVT、IC13（规则），IC15、SVTP、CUTE（不规则）。可参考 Reference 中的 deep-text-recognition-benchmark。
- 文字检测：ICDAR 2015（四边形）、Total-Text/CTW1500（弯曲）、MSRA-TD500（长文本）、MLT（多语种）。
- 中文：RCTW-17、CTW、PaddleOCR 汇总的通用中英文数据集。
- 手写：IAM、CASIA。
- 注意不同论文的词表大小、大小写与特殊字符处理会影响指标，比较前需保证评测协议一致。

## Reference

- [VLR - Code - Data](https://www.vlrlab.net/code)
- [TextDetection文本检测数据集汇总](https://www.cnblogs.com/Tom-Ren/p/11054728.html)
- [Awesome-Scene-Text-Recognition](https://github.com/chongyangtao/Awesome-Scene-Text-Recognition/blob/master/README.md#datasets)
- [Total-Text-Dataset](https://github.com/cs-chan/Total-Text-Dataset)
- [深度学习-OCR_Overview - 训练数据集](http://xiaofengshi.com/2019/01/05/%E6%B7%B1%E5%BA%A6%E5%AD%A6%E4%B9%A0-OCR_Overview/)
- [OCR_DataSet](https://github.com/WenmuZhou/OCR_DataSet)
- [deep-text-recognition-benchmark](https://github.com/clovaai/deep-text-recognition-benchmark)
- [部分OCR实用中文数据集](https://zhuanlan.zhihu.com/p/146650350)
- [通用中英文OCR数据集 - PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR/blob/develop/doc/doc_ch/datasets.md)
- [awesome-ocr-resources](https://github.com/ZumingHuang/awesome-ocr-resources)
- [ocr-open-dataset](https://github.com/xylcbd/ocr-open-dataset)
- [Dataset list - TC11](http://www.iapr-tc11.org/mediawiki/index.php?title=Datasets_List)

