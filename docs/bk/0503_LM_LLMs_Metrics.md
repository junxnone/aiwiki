-----

| Title     | LM LLMs Metrics                                       |
| --------- | ----------------------------------------------------- |
| Created @ | `2025-02-08T07:57:07Z`                                |
| Updated @ | `2025-02-08T07:57:07Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/503) |

-----

# LLMs Metrics

  - LLMs 存在的问题
      - 内存占用高
      - 计算资源未充分利用
      - 高延迟
      - 难以处理长文本

## 推理速度

  - **TTFT** - Time To First Token
  - **TPOT** - Time Per Output Token
  - **Latency** = **TTFT** + **TPOT** \* (the number of tokens to be
    generated)
  - **Throughput** - The number of output tokens per second

-----

  - Output length dominates overall response latency
  - Input length is not significant for performance but important for
    hardware requirements
  - Overall latency scales sub-linearly with model size

## Reference

  - [LLM推理速度飙升23倍！Continuous
    Batching：解锁LLM潜力！](https://cloud.tencent.com/developer/article/2350466)
  - [LLM Inference Performance Engineering: Best
    Practices](https://www.databricks.com/blog/llm-inference-performance-engineering-best-practices)
