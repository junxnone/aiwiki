---
Title | ML Tasks Image OCR TextScanner
-- | --
Created @ | `2020-05-15T05:52:22Z`
Last Modify @| `2022-12-24T13:04:03Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/192)

---
## Reference
- [paper - 2019 - TextScanner: Reading Characters in Order for Robust Scene Text Recognition
](https://arxiv.org/pdf/1912.12422.pdf)
- [旷视研究院提出TextScanner：确保字符阅读顺序，实现文字识别新突破](https://zhuanlan.zhihu.com/p/100683420?utm_source=qq)
- [【OCR实践系列】TextScanner的一些研究](https://zhuanlan.zhihu.com/p/133662322) --- [TF 实现](https://github.com/piginzoo/textscanner)

## Brief
- History issues

Model | 缺点 | 优点
-- | -- | --
RNN | 注意力漂移
Segmentation | 字符分割为不同部分 & 多字符黏连 | 不规则字体识别

- 基于 `CA-FCN`
  - Remove Character Attentions - CA
  - ResNet-50
- `Vatti clipping algo` - vati 1992
- `Sequence label` - `Character label` - Mutual-Supervision
- Branch

Branch | Output | Description
-- | -- | --
Class Branch<br>类别分支 | Character Segmentation Maps | 字符分割 mask
Geometry Branch<br>几何分支 | Localization Maps | 字符位置顺序

### Attention Decoder vs Segmentation-based vs TextScanner
![image](https://user-images.githubusercontent.com/2216970/82168502-7e327e00-98f1-11ea-8d1b-ac24572b9449.png)

## Arch

![image](https://user-images.githubusercontent.com/2216970/82168597-a8843b80-98f1-11ea-974e-f8ebe2b5b073.png)

## Class Branch
- CNN Backbone --> 3x3 + 1x1 Conv Layers --> Softmax Layer -->  Character Segmentation maps
- Output - G - `hxwxc`
  - `c` = all character classes + background

## Geometry Branch
- CNN Backbone -->  sigmoid layer --> Localization Maps
- CNN Backbone --> Encoder --> RNN(GRU) --> Decoder --> Order Segmentation Maps
- Output 
  - Localization map - Q - `hxwx1`
  - Order segmentation maps - S -`hxwxN`
    - `N` - 预定义的字符序列长度
  - Order map - `H = Q * S` - `hxwxN`

![image](https://user-images.githubusercontent.com/2216970/82168720-0fa1f000-98f2-11ea-9af0-5b9d58474be3.png)

### Mutual-Supervision

![image](https://user-images.githubusercontent.com/2216970/82181820-d4191d00-9915-11ea-8dda-feade1c85b15.png)

## Word Formation

classification scores | ![image](https://user-images.githubusercontent.com/2216970/82173655-965dc980-9900-11ea-9d11-f60a3e9bfeda.png)
-- | --

## Training
- `5 epchs` pre-train `@SynthText - character level` + `1 epoch` fine-tuning `@real images sequence-level`
- Init LR = `10^-3` -> `10^-4` -> `10^-5`
- Input - Resize to `64x256`
- Adam

![image](https://user-images.githubusercontent.com/2216970/82173461-ea1be300-98ff-11ea-8ce4-44b1864cbfdf.png)

## Loss
![image](https://user-images.githubusercontent.com/2216970/82179029-f6a83780-990f-11ea-8c38-f43c74107650.png)

- `Lc` - Localization map
- `Lo` -  Order segmentation
- `Ls` -  Text segmentation
- `Lm` - Mutual supervision 
- `λ`  
  - `λl` - `=10`
  - `λo` - `=10`
  - `λm`  
    - pretrain `=0` 
    - 其他 `=1`

Mutual supervision  Loss  | ![image](https://user-images.githubusercontent.com/2216970/82182754-5a822e80-9917-11ea-8fa1-c270407d23f9.png)<br>![image](https://user-images.githubusercontent.com/2216970/82182801-6ff75880-9917-11ea-94f2-7c400098a4aa.png)
-- | --

> `λ = 0.2`  - `γ = 2`

## Test

**English Dataset Test**
- IC13 - ICDAR 2013
- IC15 - ICDAR 2015
- IIIT - IIIT 5K-Words
- SVT - Street View Text
- SVTP - SVT-Perspective
- CT - CUTE80
- MLT-2017
- SynthText
- Synth90K

![image](https://user-images.githubusercontent.com/2216970/82183511-b1d4ce80-9918-11ea-8cd4-6b0134d0d10d.png)

**Chinese Dataset Test**

![image](https://user-images.githubusercontent.com/2216970/82184708-a84c6600-991a-11ea-92bc-33046ed27531.png)

