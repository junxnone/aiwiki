-----

| Title     | ML Op Pooling                                         |
| --------- | ----------------------------------------------------- |
| Created @ | `2019-03-02T04:16:50Z`                                |
| Updated @ | `2023-01-31T06:46:09Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/268) |

-----

# Pooling 池化

## Reference

  - [卷积神经网络中的各种池化操作](https://zhuanlan.zhihu.com/p/112216409)
  - [Pooling Operations -
    paperwithcode](https://paperswithcode.com/methods/category/pooling-operation)

## Brief

  - Pooling - `池化` - 降维(特征图 `2x2` -\> `1` )
  - AP - `Average Pooling`
  - MP - `Max Pooling`
  - GAP - [Global Average Pooling](/Global_Average_Pooling)
  - **作用**
      - 抑制噪声，降低信息冗余
      - 缩减模型的大小/计算量, 提高计算速度
      - 提升模型的尺度不变性、旋转不变形
      - 防止过拟合
  - **超参:**
      - f : 过滤器参数(3x3的过滤器，即 f = 3)
      - s : 步幅
  - 池化过程中没有需要学习的参数。

<!-- end list -->

    f = 2
    s = 2
    相当于高度和宽度缩减一半

| Pooling                           | Figure                                                                                                                          |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Max Pooling                       | <img height="200px" src="https://user-images.githubusercontent.com/2216970/150455902-62441320-60b2-416f-aaa0-38e96cbc7bfa.png"> |
| Average Pooling<br>(Mean Pooling) | <img width="200px" src="https://user-images.githubusercontent.com/2216970/150455378-68b2d05a-4c6b-46c2-ac9c-40c756431e05.png">  |
