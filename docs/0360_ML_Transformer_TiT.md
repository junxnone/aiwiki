---
Title | ML Transformer TiT
-- | --
Created @ | `2021-03-04T01:58:58Z`
Last Modify @| `2022-12-27T06:49:39Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/360)

---
# Transformer in Transformer

## Reference
- 2021-02 **[TNT]** Transformer in Transformer[[Paper](https://arxiv.org/abs/2103.00112)] [[Code](https://github.com/huawei-noah/noah-research/tree/master/TNT)] 
- [pytorch code - lucidrains](https://github.com/lucidrains/transformer-in-transformer)

## Brief
- patch-level and pixel-level representation
- Inner T-Block ==> Patch level
- Outer T-Block ==> Pixel level

## Motivation
- 背景/存在的问题
- 做了什么尝试/分别有什么效果
- 应用领域

## Arch
![image](https://user-images.githubusercontent.com/2216970/109899121-51105a00-7cd0-11eb-9d14-5e726cc9eee0.png)

### Position encoding(patch & pixel)

![image](https://user-images.githubusercontent.com/2216970/109899156-61c0d000-7cd0-11eb-856c-9f638b3109bf.png)

## Evaluation
![image](https://user-images.githubusercontent.com/2216970/109899351-b2d0c400-7cd0-11eb-87bb-13db9c82462f.png)
![image](https://user-images.githubusercontent.com/2216970/109899376-bcf2c280-7cd0-11eb-9acc-82506298c502.png)
![image](https://user-images.githubusercontent.com/2216970/109899558-017e5e00-7cd1-11eb-8477-dde2d011f8f0.png)

## Tricks

