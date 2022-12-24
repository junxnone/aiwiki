---
Title | ML Tasks Image OCR Tools TextRecognitionDataGenerator
-- | --
Created @ | `2020-05-08T05:53:53Z`
Last Modify @| `2022-12-24T13:01:04Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/187)

---
## Reference
- [TextRecognitionDataGenerator Github](https://github.com/Belval/TextRecognitionDataGenerator/)
- [Docs](https://textrecognitiondatagenerator.readthedocs.io/en/latest/index.html)

## Brief
- `Now supporting non-latin text! @20200508`
- handwritten 
- Chinese
  - Traditional
  - Simplified
- Background - 定义背景
- Text blurring - 模糊
- Text distortion - 失真
- Text skewing - 歪斜

## Install
```
pip3 install trdg
```

## Generate samples

```
python3 trdg/run.py -xxx ....
```
Args | Description
-- | --
-c | 创建 samples 数量
-rs | 类型<br>`-let` - letters<br>`-num` - numbers<br>`-sym` - symbols
-id | background image
-w | word/image
-r | random
-f | height - 横向<br>width - 纵向
-k | 倾斜角度 `α`
-rk | 随机角度 `[-α,α]` 
-b | background: <br>0: `Gaussian Noise`<br>1: `Plain white`<br>2: `Quasicrystal`<br>3: `Image`
-m | 边距
-fi | crop text
-cs | 字符间距 [pixels]
-om | return mask


## UseCase

Description | Commands
-- | --
从指定文件生成 | `python3 run.py -c 305 -i input.txt`

