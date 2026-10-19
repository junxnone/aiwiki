---
Title | ML Tasks Image OCR
-- | --
Created @ | `2020-05-07T06:49:15Z`
Updated @| `2026-10-19T02:38:18Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/200)

---
# OCR
- OCR - Optical Character Recognition - 光学字符识别 
- HTR - Hand written Text Recognition - 手写文本识别
- STR - Scene Text Recofnition - 场景文字识别
- 传统（非深度学习）OCR 方法见 [传统OCR识别综述](https://blog.csdn.net/devcloud/article/details/103678688)（基于连通域分析、模板匹配、HOG+SVM 等手工特征的方法，是深度学习方法之前的主流路线）
- [OCR History](https://junxnone.github.io/wht/tech/ocr/)  [[edit](https://github.com/junxnone/wht/issues/8)]
- **Tasks**
  - Text Detection - Text Localization - Text Segmentation：定位文字在图像里的位置（框/多边形/像素掩码）
  - Text Recognition：把已经定位/裁剪好的文字区域转成文字序列
  - Text Spotting - End to End：检测 + 识别一起做，而不是训练两个独立模型简单串联——好处是两个子任务共享底层特征、可以联合优化（检测结果不准会直接影响识别效果，反之识别阶段的梯度也能反过来帮助检测分支学到对识别更友好的框），典型代表见下文 FOTS
- [OCR Lexicon](0198_ML_Tasks_Image_OCR_Lexicon)
- [OCR Metrics](0190_ML_Tasks_Image_OCR_Metrics)
- **Tools**
  - [TextRecognitionDataGenerator](0187_ML_Tasks_Image_OCR_Tools_TextRecognitionDataGenerator)
  - [Calamari](0201_ML_Tasks_Image_OCR_Calamari)（含 [Voting](0202_ML_Tasks_Image_OCR_Calamari_Voting) 多模型投票策略）
- [OCR Augmentation](0203_ML_Tasks_Image_OCR_Augmentation)


## Methods
- Detection
  - Object Detection
  - Object Segmentation
- Recognition
  - **CTC-Based (CNN/RNN/Attention)**：CTC（Connectionist Temporal Classification）解决的是"图像宽度方向的特征序列"和"不定长的文字序列"之间没有逐字对齐标注时怎么训练的问题——网络在每个时间步都输出一个字符概率分布（含一个特殊的"空白"类别），训练时用动态规划（前向-后向算法）把所有能通过"合并连续重复字符、再去掉空白符"规约出目标文字串的路径概率加总作为似然，不需要知道每个字符具体对应图像里哪个位置；推理时贪心/束搜索解码。详见 [Install warp-ctc](0189_ML_Tasks_Image_OCR_CTC)
  - **Seq2Seq (CNN/Attention)**：用编码器把图像编码成一组特征向量，解码器像机器翻译一样逐字符自回归生成，每一步通过注意力机制动态聚焦图像的不同区域（通常对应下一个要识别的字符位置）——不需要 CTC 那种"空白+去重"的规约规则，能天然处理字符间的上下文依赖（比如利用语言模型先验纠正形近字），但自回归解码比 CTC 的并行解码慢
- End2End

检测阶段还可以按粒度分成两种思路：

Name | Description
-- | --
Bottom-Up | 字符 -> `textline`，先找字符/文字片段再组装成文本行，对不规则排布文本更鲁棒，但容易因为字符分组错误而出错
Top-Down | `text ROI`  -> 字符，先框出整行/整块文本区域再识别，流程更简单，但对弯曲/任意形状文本不友好

## Algos（深度学习时代，2015-2019）

Year | Name | Description
-- | -- | --
2015 | [CRNN](0196_ML_Tasks_Image_OCR_CRNN) | CNN 提特征 + RNN(BiLSTM) 建模序列 + CTC 解码，不需要字符级标注，是识别阶段最经典、至今仍广泛使用的基线架构
2016 | [CTPN](0197_ML_Tasks_Image_OCR_CTPN) | Connectionist Text Proposal Network，把文本行检测拆成一系列固定宽度的小竖条候选框再连接，擅长检测水平方向的文本行
2017 | [EAST](0193_ML_Tasks_Image_OCR_EAST) | Efficient and Accurate Scene Text detector，单阶段、端到端直接回归任意角度的文本框，不需要像 CTPN 那样多阶段后处理
2017 | Seglink | 把文本行分解成一个个小的文本片段（segment）加上片段之间的连接关系（link），再把属于同一行的片段连起来，适合长文本行检测
2017.9 |  [Sliding Convolutional](0188_ML_Tasks_Image_OCR_SW) | Sliding windows + CNN + CTC，用滑动窗口把图像切片喂给 CNN 再接 CTC 解码
2018 | [Two-Dimensional Perspective](0186_ML_Tasks_Image_OCR_CAFCN) | CA-FCN + FPN，把文本检测当成像素级分割任务，用字符注意力（Character Attention）+ 特征金字塔处理不同尺度文本
2018.1 | [FOTS](0195_ML_Tasks_Image_OCR_FOTS) | Fast Oriented Text Spotting，检测和识别共享同一套卷积特征、联合训练，是较早的端到端（End2End）文字识别代表
2019.10 | [CharNet](https://arxiv.org/pdf/1910.07954.pdf) | Character Network，直接在像素级别预测每个字符的位置和类别，不需要先验的文本行/单词级别标注
2019.12 | [TextScanner](0192_ML_Tasks_Image_OCR_TextScanner) | 把识别建模成像素级的字符分割+排序问题，对任意形状文本的识别鲁棒性较好

- [TextField](0194_ML_Tasks_Image_OCR_TextField)：用"方向场"（预测每个像素指向文本中心线的方向）来表示任意形状的文本区域，再做后处理还原出文本框
- [SCAN](0191_ML_Tasks_Image_OCR_SCAN)：在识别阶段引入空间注意力机制，让模型在生成每个字符时动态聚焦图像的不同区域

## OCR-free / 多模态大模型时代（2021 年至今）

2021 年之后，OCR 领域出现了一次范式转变：从"检测 + 识别"两阶段（或 FOTS/CharNet 这类联合训练的端到端）流水线，逐渐转向用一个视觉-语言模型**直接**从文档图像生成结构化文本（甚至直接是 Markdown/HTML），不再有独立的"文字框"这个中间产物：

- **TrOCR**（Microsoft，2021）：用预训练的图像 Transformer 做编码器、预训练的文本 Transformer 做解码器，直接把图像转成文字序列，是把 Transformer 预训练范式系统引入 OCR 识别阶段的代表工作；
- **Donut**（2021/2022，ECCV）：**OCR-free** 的文档理解 Transformer——不经过任何显式的文字检测/识别步骤，直接从文档图像端到端输出结构化信息（如字段抽取结果），"OCR-free" 这个说法由此被广泛采用；
- **PaddleOCR**：从 PP-OCRv3（2022，识别模块换成基于 Transformer 的 SVTR 架构取代 LSTM）一路迭代到 2025-05 发布的 **PaddleOCR 3.0 / PP-OCRv5**，是工业界使用最广泛的开源 OCR 工具链之一；2025-10 进一步推出仅 0.9B 参数的 **PaddleOCR-VL**，支持 109 种语言；
- **Nougat**（Meta，2023）：面向学术文档（含数学公式、表格）的 OCR-free 神经网络解析方法；
- **GOT-OCR2.0、dots.ocr、DeepSeek-OCR** 等（2024-2025）：基于 Qwen-VL 等视觉语言基础模型微调出的通用文档解析模型，一次推理同时搞定文字检测、识别、版面/表格/公式结构化，不再是传统的多阶段流水线；其中 **DeepSeek-OCR**（2025-10）提出了"用视觉表示压缩文本"的新思路——把大段文字渲染成图像再用视觉 Token 编码，比直接用文本 Token 编码效率最高可提升约 10 倍，单张 A100 一天可处理约 20 万页文档；
- 仅 2025 年 10 月一个月，业内就密集发布了 Nanonets-OCR2-3B、PaddleOCR-VL-0.9B、DeepSeek-OCR-3B、Chandra-OCR-8B、OlmOCR-2-7B、LightOnOCR-1B 六个主力开源 OCR/文档解析模型，是这个方向目前演进速度的直观体现。

这条路线最大的优势是**原生处理复杂版面**（多栏、表格、数学公式混排）不需要额外设计规则，但相比传统检测+识别流水线，推理成本更高、对训练数据的要求也更高。

## 数据集

| 数据集 | 类型 | 特点 |
|---|---|---|
| **ICDAR 系列**（2013/2015/2017/2019...） | 场景文本检测+识别 | [ICDAR](http://icdar2019.org/) 比赛配套数据集，是这个领域最权威、最常被拿来对比的基准系列，每届侧重点不同（如 2015 侧重任意方向文本，2017/2019 侧重多语言） |
| **SynthText** | 合成场景文本 | 把文字渲染合成到自然背景图上自动生成大量带精确标注的训练数据，缓解真实标注稀缺问题，是训练检测/识别模型常用的预训练数据来源 |
| **Total-Text、CTW1500** | 场景文本检测 | 专门针对**弯曲文本**（curved text）标注的数据集，推动检测方法从"矩形框"走向"任意形状多边形/像素级掩码" |
| **IIIT5K、SVT、ICDAR03/13** | 场景文本识别 | 经典的裁剪词级识别基准，早期识别方法的标准测试集 |
| **CASIA-HWDB** | 手写文本 | 中文手写字符/文本行数据集，是手写识别方向的常用基准 |

场景文本检测/识别方向的榜单可以直接参考 [Scene Text Detection - Leaderboards](https://paperswithcode.com/task/scene-text-detection) 和 [scene-text-recognition](https://paperswithcode.com/task/scene-text-recognition/) 的实时排名。

## 应用 & 面临的问题
- **文档文本**
  - 单行文本：相对最简单的场景，背景干净、字体规整
  - 表格：除了识别文字，还要还原表格的行列结构，单纯的文本检测+识别不够，需要额外的表格结构识别
  - 特定格式（车票、税单...）：版面相对固定，早期常用模板匹配/关键字段定位（Keyword Spotting，见 [Reference](https://en.wikipedia.org/wiki/Keyword_spotting)），现在也越来越多用端到端的文档理解模型
- **手写字体**
  - 签名：个体书写风格差异极大，样本稀缺，且很多场景下签名识别的目标其实是"验证是不是本人"（签名验证）而不是"读出文字"
  - 试卷：手写体 + 公式/图形混排 + 涂改痕迹，对识别鲁棒性要求很高
  - 古籍：异体字、残缺/污损字迹、竖排版式，训练数据规模通常很小，是整个 OCR 领域里公认难度最高的子方向之一
- **自然场景**
  - 多形态文本：弯曲、透视变形、任意方向排布（招牌、车牌、商品包装上的文字），对检测框的表示能力要求高（矩形框不够用，需要任意多边形/像素掩码）
  - 艺术字体：装饰性强、笔画变形大，和训练数据里"规整印刷体"的分布差异大，容易泛化失败
  - 光照/遮挡/模糊/低分辨率等真实世界的成像退化因素会叠加在上述问题之上，进一步增加难度
- 复杂版面（多栏排版、表格、数学公式混排）过去依赖检测+识别流水线叠加大量规则后处理，现在更多场景会直接用上文的 VLM/文档解析大模型端到端处理

## Term

Name | Description
-- | --
BDLHW | Batch/Dimension/Length/Height/Width


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
- [TrOCR: Transformer-based Optical Character Recognition with Pre-trained Models](https://arxiv.org/abs/2109.10282)
- [Donut: OCR-free Document Understanding Transformer](https://arxiv.org/abs/2111.15664)
- [PaddleOCR 3.0 Technical Report](https://arxiv.org/pdf/2507.05595)
- [DeepSeek-OCR](https://huggingface.co/collections/deepseek-ai/deepseek-ocr)

