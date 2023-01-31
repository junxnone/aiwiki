---
Title | ML Tasks Image Classification Inception V4
-- | --
Created @ | `2019-12-04T10:51:56Z`
Updated @| `2023-01-31T06:34:42Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/47)

---
# Inception V4

## Reference
- 2016 **Inception V4 & Inception-ResNet**  Inception-v4, Inception-ResNet and the Impact of Residual Connections on Learning [[paper](https://arxiv.org/pdf/1602.07261.pdf)]


## Brief
- Inception V4 和 Inception-ResNet 是同一篇 paper 提出
- 修改了Inception的Stem
- 添加了Reduction Block
- 添加了 ResNet

## Inception V4
- Stem
- Inception-A Block
- Inception-B Block
- Inception-C Block
- Reduction Module A
- Reduction Module B

![image](https://user-images.githubusercontent.com/2216970/70136613-4dee7e80-16c7-11ea-947e-3e903cca736d.png)



### Stem Block

![image](https://user-images.githubusercontent.com/2216970/70136969-f0a6fd00-16c7-11ea-8338-1601dab1eef7.png)

### Inception and Reduction  Blocks

Name | Block
-- | --
Inception-A | ![image](https://user-images.githubusercontent.com/2216970/70136883-d2d99800-16c7-11ea-871e-c0b9f1489431.png)
Inception-B | ![image](https://user-images.githubusercontent.com/2216970/70137020-09171780-16c8-11ea-80f1-5fed44b92085.png)
Inception-C | ![image](https://user-images.githubusercontent.com/2216970/70137050-192ef700-16c8-11ea-8888-58877a60e2b1.png)
Reduction-A |![image](https://user-images.githubusercontent.com/2216970/70137292-95293f00-16c8-11ea-97fb-6f7650fe6b3b.png)
Reduction-B | ![image](https://user-images.githubusercontent.com/2216970/70137244-7cb92480-16c8-11ea-8f21-736ea846d46b.png)


## Inception-ResNet
![image](https://user-images.githubusercontent.com/2216970/70206506-bdfe1280-1762-11ea-92f5-d4b855ed4cb1.png)

### Stem Block
- Inception-ResNet-V2 同 Inception V4
- Inception-ResNet-V1 如下
---
![image](https://user-images.githubusercontent.com/2216970/70206443-8727fc80-1762-11ea-8f47-eebb1a36bacd.png)

### ResNet v1  Inception and Reduction  Blocks

Name | Block
-- | --
Inception-ResNet-A | ![image](https://user-images.githubusercontent.com/2216970/70206186-a1ada600-1761-11ea-8771-c5c3adfc1271.png)
Inception-ResNet-B | ![image](https://user-images.githubusercontent.com/2216970/70206205-b9852a00-1761-11ea-86f7-de4530254049.png)
Inception-ResNet-C | ![image](https://user-images.githubusercontent.com/2216970/70206266-e3d6e780-1761-11ea-9499-6b5063ed4f97.png)
Reduction-A |  同 Inception V4
Reduction-B | ![image](https://user-images.githubusercontent.com/2216970/70206230-cdc92700-1761-11ea-94e9-42937de4e2df.png)

### ResNet v2  Inception and Reduction  Blocks

Name | Block
-- | --
Inception-ResNet-A | ![image](https://user-images.githubusercontent.com/2216970/70206839-bf7c0a80-1763-11ea-93ef-dea048c5d997.png)
Inception-ResNet-B | ![image](https://user-images.githubusercontent.com/2216970/70206850-c9057280-1763-11ea-878b-08be95627ea2.png)
Inception-ResNet-C | ![image](https://user-images.githubusercontent.com/2216970/70206861-d0c51700-1763-11ea-811f-5d56b5b3b556.png)
Reduction-A |  同 Inception V4
Reduction-B | ![image](https://user-images.githubusercontent.com/2216970/70206907-f7834d80-1763-11ea-890f-c6d66789c198.png)
> Reduction-B 中的 `wider Inception-ResNet-v1` 应该就是指 `Inception-ResNet-v2`

## Test Result
![image](https://user-images.githubusercontent.com/2216970/70207200-05859e00-1765-11ea-9c53-a1e4057de850.png)

