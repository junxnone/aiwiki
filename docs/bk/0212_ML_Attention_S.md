-----

| Title         | ML Attention S                                        |
| ------------- | ----------------------------------------------------- |
| Created @     | `2020-05-09T02:39:37Z`                                |
| Last Modify @ | `2022-12-25T05:03:58Z`                                |
| Labels        | `index`                                               |
| Edit @        | [here](https://github.com/junxnone/aiwiki/issues/212) |

-----

# Attention Is All You Need

## Reference

  - [paper - 2017 - Attention Is All You
    Need](https://arxiv.org/pdf/1706.03762.pdf)
  - [The Illustrated
    Transformer](http://jalammar.github.io/illustrated-transformer/)
  - [解析Transformer模型](https://mp.weixin.qq.com/s/kjLFPyTb7pal7oorX3ejkw)
  - [position\_encoding](https://github.com/tensorflow/examples/blob/master/community/en/position_encoding.ipynb)
  - [transformer jupyter notebook -
    tensorflow](https://github.com/tensorflow/docs/blob/master/site/en/tutorials/text/transformer.ipynb)

## Brief

  - 堆叠 Encoders-Decoders
      - do not share weight
  - 并行计算
  - Attention
      - Self-attention
      - Multi-Head Attention
  - Feed Forward
  - [Position Encoding](/Position_Encoding)

## Arch

| ![image](media/086dd419856041f1c2036e04797ce59265d7696f.png) | ![image](media/0c1dc7e516c265f3c45058440c2f47f5e7e18f81.png) |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| \~                                                           | ![image](media/8168ccb5fc87c14b9b7314657764db01237dec13.png) |

### Encoder

| Encoder                                                      | Self-Attention                                               |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| ![image](media/4d51e4aa102d43fc7c04a3596873849821de5f6d.png) | ![image](media/1e28c72279ef97b8b34fa70d02c7c13b5543d765.png) |

#### Self-Attention

| Steps | Description                                      | Figure                                                       |
| ----- | ------------------------------------------------ | ------------------------------------------------------------ |
| 1     | Queries & Keys & Values                          | ![image](media/51ed24da2d1a558d2e802fea9ec3d19e17bc1a6b.png) |
| 2     | Calculate score                                  | ![image](media/0c15131fbbf7b560ff8b4deeb448dae29da66efa.png) |
| 3     | Divide by 8 `= 64^1/2` <br>more stable gradients | ![image](media/44e6caf9c75f9038c021c4821b2dc41bcd981ed2.png) |
| 4     | Softmax                                          | 同上                                                           |
| 5     | `Score x Values`                                 | ![image](media/7bc595ec1a5b951f14579f2f241bcf395f87dd8f.png) |
| 6     | \+ weighted value vectors                        | 同上                                                           |

**Matrix Calculation**
![image](media/4f2b60d9fca3ba8c7277614f74b419eebf113e64.png)

| ![image](media/71e4db91d7d78d0a275d363cf8f9f41dd37ce080.png) | ![image](media/44bd6841b67fd858da7b1317af91aa569cc725f2.png) | ![image](media/97927dc81d30ed32c53e2c2cc8ebcb6c0371c25d.png) |
| ------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ |

#### MultiHead-Attention

  - N 个 `Self-Attention` 合并

| ![image](media/6467bde589cf35b7994cd7353957359f9f765245.png) | ![image](media/2e933d2fe0971fb6b21841316f90932556212eea.png) |
| ------------------------------------------------------------ | ------------------------------------------------------------ |

**Head 1 vs 2 vs 8**

| Head-1                                                       | Head-2                                                       | Head-8                                                       |
| ------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ |
| ![image](media/1e28c72279ef97b8b34fa70d02c7c13b5543d765.png) | ![image](media/cc91e15b924af51e25ddab3cebfc8a74e085aba9.png) | ![image](media/155fa76f41f2c692510c29ebc250ef13d4d74389.png) |

**Matrix Calculation**

| Calculate Q/K/V | ![image](media/ea9d9bd244d521bb1e2bd49e35973b28fc7a04e0.png) |
| --------------- | ------------------------------------------------------------ |
| Calculate Z     | ![image](media/65deaac7ece4b6e896a3475da198db6e5c4bb7bf.png) |
| Concatenate Z   | ![image](media/56bc7cdea72a419f7801ea7d10c6d10076d28d8c.png) |

#### Feed Forward

  - `Dense` --\> `  RELU ` --\> `Dense`

#### Positional Encoding

  - 使用正弦函数和余弦函数来构造每个位置的值
  - 可以在测试阶段接受长度超过训练集实例的情况
    ![image](media/a78d07705e12c5d1a6e5b085a5d6b0e722b17dee.png)

## 存在问题

  - 复杂度 O(n^2), 需要计算量大
