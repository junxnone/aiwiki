-----

| Title         | Datasets Image2D OCR                                  |
| ------------- | ----------------------------------------------------- |
| Created @     | `2020-05-07T11:01:54Z`                                |
| Last Modify @ | `2022-12-24T16:13:12Z`                                |
| Labels        | \`\`                                                  |
| Edit @        | [here](https://github.com/junxnone/aiwiki/issues/240) |

-----

## Reference

  - [VLR - Code - Data](https://www.vlrlab.net/code)
  - [TextDetection文本检测数据集汇总](https://www.cnblogs.com/Tom-Ren/p/11054728.html)
  - [Awesome-Scene-Text-Recognition](https://github.com/chongyangtao/Awesome-Scene-Text-Recognition/blob/master/README.md#datasets)
  - [Total-Text-Dataset](https://github.com/cs-chan/Total-Text-Dataset)
  - [深度学习-OCR\_Overview -
    训练数据集](http://xiaofengshi.com/2019/01/05/%E6%B7%B1%E5%BA%A6%E5%AD%A6%E4%B9%A0-OCR_Overview/)
  - [OCR\_DataSet](https://github.com/WenmuZhou/OCR_DataSet)
  - [deep-text-recognition-benchmark](https://github.com/clovaai/deep-text-recognition-benchmark)
  - [部分OCR实用中文数据集](https://zhuanlan.zhihu.com/p/146650350)
  - [通用中英文OCR数据集 -
    PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR/blob/develop/doc/doc_ch/datasets.md)
  - [awesome-ocr-resources](https://github.com/ZumingHuang/awesome-ocr-resources)
  - [ocr-open-dataset](https://github.com/xylcbd/ocr-open-dataset)
  - [Dataset list -
    TC11](http://www.iapr-tc11.org/mediawiki/index.php?title=Datasets_List)

## Brief

分类

  - Regular Text
      - IIIT - IIIT5K-Wrods
      - [IC13 -
        ICDAR 2013](http://dagdata.cvc.uab.es/icdar2013competition/)
      - [SVT - Street View Text](http://tc11.cvc.uab.es/datasets/SVT_1)
  - Irregular Text
      - [IC15 - ICDAR 2015](https://rrc.cvc.uab.es/)
      - SVTP
      - CUTE
  - HTR
  - [IAM On-Line Handwriting
    Database](http://www.fki.inf.unibe.ch/databases/iam-on-line-handwriting-database)

## Real Datasets

  - [CASIA Online and Offline Chinese Handwriting
    Databases](http://www.nlpr.ia.ac.cn/databases/handwriting/Home.html)
  - [COCO Text](https://bgshih.github.io/cocotext/)

## Synthetic Datasets

  - [TextRecognitionDataGenerator](https://github.com/Belval/TextRecognitionDataGenerator/)

## ICDAR

| Dataset                                                                                           | Discription                                                                | Competition Paper                                                                                                                                            |
| ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [ICDAR 2015](http://rrc.cvc.uab.es/)                                                              | 1000 training images and 500 testing images                                | `paper` [![link](media/d26c02f8bccb5cc1a72ed315b55a8e9ed1a1f52f.jpg)](http://rrc.cvc.uab.es/files/Robust-Reading-Competition-Karatzas.pdf)                   |
| [ICDAR 2013](http://dagdata.cvc.uab.es/icdar2013competition/)                                     | 229 training images and 233 testing images                                 | `paper` [![link](media/d26c02f8bccb5cc1a72ed315b55a8e9ed1a1f52f.jpg)](http://dagdata.cvc.uab.es/icdar2013competition/files/icdar2013_competition_report.pdf) |
| [ICDAR 2011](http://robustreading.opendfki.de/trac/)                                              | 229 training images and 255 testing images                                 | `paper` [![link](media/d26c02f8bccb5cc1a72ed315b55a8e9ed1a1f52f.jpg)](http://www.iapr-tc11.org/archive/icdar2011/fileup/PDF/4520b491.pdf)                    |
| [ICDAR 2005](http://www.iapr-tc11.org/mediawiki/index.php/ICDAR_2005_Robust_Reading_Competitions) | 1001 training images and 489 testing images                                | `paper` [![link](media/d26c02f8bccb5cc1a72ed315b55a8e9ed1a1f52f.jpg)](http://www.academia.edu/download/30700479/10.1.1.96.4332.pdf)                          |
| [ICDAR 2003](http://www.iapr-tc11.org/mediawiki/index.php/ICDAR_2003_Robust_Reading_Competitions) | 181 training images and 251 testing images(word level and character level) | `paper` [![link](media/d26c02f8bccb5cc1a72ed315b55a8e9ed1a1f52f.jpg)](http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.332.3461&rep=rep1&type=pdf)   |

## Others Dataset

  - [`MLT 2017`](http://rrc.cvc.uab.es/?ch=8&com=introduction) `2017`
    
      - 7200 training, 1800 validation images
      - Bounding box, text transcription, and script annotations
      - Task: text detection, script identification

  - [`COCO-Text (Computer Vision Group,
    Cornell)`](http://vision.cornell.edu/se3/coco-text/) `2016`
    
      - 63,686 images, 173,589 text instances, 3 fine-grained text
        attributes.
      - Task: text location and recognition
      - [`COCO-Text API`](https://github.com/andreasveit/coco-text)

  - [`Synthetic Word Dataset (Oxford,
    VGG)`](http://www.robots.ox.ac.uk/~vgg/data/text/) `2014`
    
      - 9 million images covering 90k English words
      - Task: text recognition, segmentation
      - [`download`](http://www.robots.ox.ac.uk/~vgg/data/text/mjsynth.tar.gz)

  - [`IIIT 5K-Words`](http://cvit.iiit.ac.in/projects/SceneTextUnderstanding/IIIT5K.html)
    `2012`
    
      - 5000 images from Scene Texts and born-digital (2k training and
        3k testing images)
      - Each image is a cropped word image of scene text with
        case-insensitive labels
      - Task: text recognition
      - [`download`](http://cvit.iiit.ac.in/projects/SceneTextUnderstanding/IIIT5K-Word_V3.0.tar.gz)

  - [`StanfordSynth(Stanford, AI
    Group)`](http://cs.stanford.edu/people/twangcat/#research) `2012`
    
      - Small single-character images of 62 characters (0-9, a-z, A-Z)
      - Task: text recognition
      - [`download`](http://cs.stanford.edu/people/twangcat/ICPR2012_code/syntheticData.tar)

  - [`MSRA Text Detection 500 Database
    (MSRA-TD500)`](http://www.iapr-tc11.org/mediawiki/index.php/MSRA_Text_Detection_500_Database_\(MSRA-TD500\))
    `2012`
    
      - 500 natural images(resolutions of the images vary from 1296x864
        to 1920x1280)
      - Chinese, English or mixture of both
      - Task: text detection

  - [`Street View Text (SVT)`](http://tc11.cvc.uab.es/datasets/SVT_1)
    `2010`
    
      - 350 high resolution images (average size 1260 × 860) (100 images
        for training and 250 images for testing)
      - Only word level bounding boxes are provided with
        case-insensitive labels
      - Task: text location

  - [`KAIST Scene_Text
    Database`](http://www.iapr-tc11.org/mediawiki/index.php/KAIST_Scene_Text_Database)
    `2010`
    
      - 3000 images of indoor and outdoor scenes containing text
      - Korean, English (Number), and Mixed (Korean + English + Number)
      - Task: text location, segmantation and recognition

  - [`Chars74k`](http://www.ee.surrey.ac.uk/CVSSP/demos/chars74k/)
    `2009`
    
      - Over 74K images from natural images, as well as a set of
        synthetically generated characters
      - Small single-character images of 62 characters (0-9, a-z, A-Z)
      - Task: text recognition

-----

  - [IC03](http://www.iapr-tc11.org/mediawiki/index.php/ICDAR_2003_Robust_Reading_Competitions)
  - [Total-Text -
    ICDAR 2017](http://www.cs-chan.com/source/ICDAR2017/totaltext.zip)
  - [CTW - Chinese Text in the Wild](https://ctwdataset.github.io/)
  - [RCTW-17 - Reading Chinese Text in the
    Wild](http://mclab.eic.hust.edu.cn/icdar2017chinese/dataset.html)
  - [ICPR MWI 2018
    挑战赛](https://tianchi.aliyun.com/competition/entrance/231651/introduction)
  - [Google FSNS(谷歌街景文本数据集)](http://rrc.cvc.uab.es/?ch=6&com=downloads)
  - [COCO-TEXT](https://vision.cornell.edu/se3/coco-text-2/)
    [++](https://bgshih.github.io/cocotext/)
  - Synthetic Data for Text Localisation
  - [Synthetic Word
    Dataset](http://www.robots.ox.ac.uk/~vgg/data/text/#sec-synth)
  - Caffe-ocr中文合成数据
  - [MSRA-TD500](http://www.iapr-tc11.org/mediawiki/index.php/MSRA_Text_Detection_500_Database_\(MSRA-TD500\))
  - UW3
  - UW3α
  - DTA19
