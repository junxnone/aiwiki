-----

| Title         | Tools VIS ONNX                                        |
| ------------- | ----------------------------------------------------- |
| Created @     | `2020-04-26T02:35:59Z`                                |
| Last Modify @ | `2022-12-25T04:22:43Z`                                |
| Labels        | \`\`                                                  |
| Edit @        | [here](https://github.com/junxnone/aiwiki/issues/134) |

-----

# ONNX 可视化工具

## Reference

  - [Visualizing an ONNX
    Model](https://github.com/onnx/tutorials/blob/master/tutorials/VisualizingAModel.md)
  - [onnx/tools/net\_drawer.py](https://github.com/onnx/onnx/blob/master/onnx/tools/net_drawer.py)

## Brief

  - Graphviz + pydot
  - [netron](https://github.com/junxnone/AI/issues/97)

## Graphviz + pydot

![](media/f00eccd17c5e55ec2e8f45bb3d8f090c7854a097.png)

## netron

  - alexnet

<!-- end list -->

    AlexNet(
      (features): Sequential(
        (0): Conv2d(3, 64, kernel_size=(11, 11), stride=(4, 4), padding=(2, 2))
        (1): ReLU(inplace=True)
        (2): MaxPool2d(kernel_size=3, stride=2, padding=0, dilation=1, ceil_mode=False)
        (3): Conv2d(64, 192, kernel_size=(5, 5), stride=(1, 1), padding=(2, 2))
        (4): ReLU(inplace=True)
        (5): MaxPool2d(kernel_size=3, stride=2, padding=0, dilation=1, ceil_mode=False)
        (6): Conv2d(192, 384, kernel_size=(3, 3), stride=(1, 1), padding=(1, 1))
        (7): ReLU(inplace=True)
        (8): Conv2d(384, 256, kernel_size=(3, 3), stride=(1, 1), padding=(1, 1))
        (9): ReLU(inplace=True)
        (10): Conv2d(256, 256, kernel_size=(3, 3), stride=(1, 1), padding=(1, 1))
        (11): ReLU(inplace=True)
        (12): MaxPool2d(kernel_size=3, stride=2, padding=0, dilation=1, ceil_mode=False)
      )
      (avgpool): AdaptiveAvgPool2d(output_size=(6, 6))
      (classifier): Sequential(
        (0): Dropout(p=0.5, inplace=False)
        (1): Linear(in_features=9216, out_features=4096, bias=True)
        (2): ReLU(inplace=True)
        (3): Dropout(p=0.5, inplace=False)
        (4): Linear(in_features=4096, out_features=4096, bias=True)
        (5): ReLU(inplace=True)
        (6): Linear(in_features=4096, out_features=1000, bias=True)
      )
    )

![image](media/9a66372b669d4c63a074124f3686b993f03f23c0.png)

![image](media/8fd0dd36984e77ad3d0c92c5f6f4f3f2825b3a0f.png)
