-----

| Title         | ML Attention PE                                       |
| ------------- | ----------------------------------------------------- |
| Created @     | `2021-01-29T09:56:40Z`                                |
| Last Modify @ | `2022-12-25T05:05:06Z`                                |
| Labels        | `index`                                               |
| Edit @        | [here](https://github.com/junxnone/aiwiki/issues/213) |

-----

# Position Encoding

## Reference

  - [教你直观理解 Position-Encoding](https://www.jianshu.com/p/d4ae714bd363)
  - [transformer的Position
    encoding的总结](https://zhuanlan.zhihu.com/p/95079337)
  - [如何理解Transformer论文中的positional
    encoding，和三角函数有什么关系？](https://www.zhihu.com/question/347678607/answer/864217252)

## Brief

  - 相近的位置拥有相近的位置编码向量
  - 相对位置的 位置编码向量可以通过线性变换获取

| Positional Encoding                                          |
| :----------------------------------------------------------- |
| ![image](media/644531895f6c8724a60111083eb831ae03ce9f08.png) |
| ![image](media/095f93058dc9532f30cd1ef2e86330a8286e5ac9.png) |

-----

  - 方式1 - Pos = `0,1,2,3....T-1`
      - 大数值 `T-1` 对模型干扰
  - 方式2 - Pos = `pos/(T-1)` = `[0,1]`
      - 不同长度的文本步长不同
  - 方式3 - Pos = `sin(pos/α)`
      - 仅关注一定范围内的相对次序关系
