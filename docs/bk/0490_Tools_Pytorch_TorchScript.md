-----

| Title     | Tools Pytorch TorchScript                             |
| --------- | ----------------------------------------------------- |
| Created @ | `2024-12-23T08:43:03Z`                                |
| Updated @ | `2024-12-25T01:27:53Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/490) |

-----

# TorchScript

  - Intermediate Representation of a PyTorch model
  - 用于部署时，将 pytorch model 转换为 TorchScript 格式
      - 使用 `torch.jit.trace()` 对数据进行跟踪，记录计算过程，生成相应的 torchscript 模型
      - **使用 script compiler:** `torch.jit.script()` 直接编译模型的代码，将其转换为
        TorchScript，能够更好地处理包含控制流的情况
  - Debug
      - 可以对定义的 model 中的部分模块进行处理，来查看哪部分code 定义存在问题(例如
        `torch.jit.script(model.DecoderA)`)
  - **保存和加载**: 保存的文件中包含代码，参数，属性和debuginfo，可以加载到非 python code 中执行
      - {}.save("xxx.pt")
      - torch.jit.load('xxx.pt')
