-----

| Title     | Tools OV MO                                           |
| --------- | ----------------------------------------------------- |
| Created @ | `2018-11-11T15:06:52Z`                                |
| Updated @ | `2026-10-20T02:07:35Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/181) |

-----

# Model Optimizer

> openvino.mo 已被移除，本章节作为模型优化章节综述继续讲解 openvino 模型优化方面的工作 旧（MO） | 新（OVC
> /ov.convert\_model） -- | -- mo --input\_model xxx.onnx | ovc xxx.onnx
> -o xxx.xml from openvino.tools.mo import convert\_model | import
> openvino as ov; ov.convert\_model() 大量转换参数、model cut、老式 preprocess 参数
> | 形状 / 输入信息放到 input 参数；预处理交给 ov.PrePostProcessor；部分高级裁剪能力有差异
