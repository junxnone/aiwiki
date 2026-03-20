-----

| Title     | Tools OV OPs CPUImpl                                  |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-03-20T07:20:58Z`                                |
| Updated @ | `2026-03-20T07:20:58Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/534) |

-----

# OPs CPU Impl

  - 部分 OPs 是根据 CPU 指令集（ISA）和执行精度（exec\_prc\_），动态生成加法算子（Add）的 JIT 汇编代码，例如
    ADD/Sub/Mul/Mul\_Add/Div/...
