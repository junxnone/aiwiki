---
Title | ML AutoML NAS ENAS
-- | --
Created @ | `2020-07-20T02:42:57Z`
Updated @| `2023-03-25T14:46:14Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/391)

---



# ENAS

- 子模型共享参数, 提高效率，减少所需计算资源
- macro search space over entire convolutional models
- micro search space over sonvolutional cells
- Decision Block
- Conv Cell
- Reduction Cell

## Search Space
- Model = Blocks x N
- Blocks = Conv Cell x N + Reduction x M
- Cell = Node x B (B=4)

Entire Search Space
-- |
![image](https://user-images.githubusercontent.com/2216970/88244180-9e9e0080-ccc5-11ea-8dcf-9442b7d443de.png)

macro Search Space | Micro Search Space
-- | --
![image](https://user-images.githubusercontent.com/2216970/88244237-cb521800-ccc5-11ea-9d4e-ce2954a1c87c.png) | ![image](https://user-images.githubusercontent.com/2216970/88244261-e02eab80-ccc5-11ea-8bf8-8f8fe32f401e.png)<br>![image](https://user-images.githubusercontent.com/2216970/88244293-f472a880-ccc5-11ea-9596-28f1822a0275.png)

Macro Search Space - Node Avaliable Operations | Micro Search Space - Node Available Operations 
-- | --
 ` `| identity
convolutions with filter sizes 3 × 3 | 
convolutions with filter sizes 5 × 5 | 
depthwise-separable convolutions with filter sizes 3×3 | separable convolution with kernel size 3 × 3 
depthwise-separable convolutions with filter sizes 5×5 | separable convolution with kernel size  5 × 5
max pooling of kernel size 3 × 3 | max pooling with kernel size 3×3
average pooling of kernel size 3 × 3 | average pooling with kernel size 3×3

Recurrent Cell |
-- |
![image](https://user-images.githubusercontent.com/2216970/88244195-b1183a00-ccc5-11ea-969a-fc8b5d86e244.png)


## Discovered 

Name | Discovered
-- | --
RNN Cell | ![image](https://user-images.githubusercontent.com/2216970/88244441-795dc200-ccc6-11ea-87bb-235f7ec31553.png)
CNN Network | ![image](https://user-images.githubusercontent.com/2216970/88244499-9d210800-ccc6-11ea-8912-9b66403cf4fc.png)
Convolution Cell | ![image](https://user-images.githubusercontent.com/2216970/88244519-ac07ba80-ccc6-11ea-82d4-8ad528c150fc.png)
Reduction Cell | ![image](https://user-images.githubusercontent.com/2216970/88244545-bcb83080-ccc6-11ea-9364-44dfc6e14440.png)

## Reference

- [paper - 2018 - Efficient Neural Architecture Search via Parameter Sharing](https://arxiv.org/pdf/1802.03268.pdf)
- [论文笔记系列-Efficient Neural Architecture Search via Parameter Sharing](https://www.cnblogs.com/marsggbo/p/9435954.html)
- [Github - Authors - Tensorflow](https://github.com/melodyguan/enas)
- [ENAS-pytorch](https://github.com/carpedm20/ENAS-pytorch)
- [AutoDL论文解读（四）：权值共享的搜索](https://blog.csdn.net/u014157632/article/details/102501816)
- [【ENAS】2018-ICML-Efficient Neural Architecture Search via Parameter Sharing-论文阅读](https://www.cnblogs.com/chenbong/p/13137561.html)
