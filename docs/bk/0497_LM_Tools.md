-----

| Title     | LM Tools                                              |
| --------- | ----------------------------------------------------- |
| Created @ | `2025-02-05T06:58:17Z`                                |
| Updated @ | `2026-11-26T08:28:55Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/497) |

-----

# 大模型相关工具

## 大模型试用 Web/App

  - ChatGPT系列 OpenAI
  - [Gemini](https://gemini.google.com/) - Google
  - 豆包 App - 字节跳动
      - web 扩展可以读论文
  - DeepSeek - 深度求索
  - 文小言 - 百度
  - 智普清言
  - 通义 - 阿里
  - 天工
  - ...

## 大模型推理框架

  - [sglang](https://github.com/sgl-project/sglang)
  - [ollama](https://ollama.com/)
  - [vllm](https://github.com/vllm-project/vllm)
  - [llama.cpp](https://github.com/ggerganov/llama.cpp)
  - [MNN-LLM](https://github.com/alibaba/MNN/blob/master/README_CN.md)

### 对比

| 框架        | 定位          | 特点                                          |
| --------- | ----------- | ------------------------------------------- |
| vllm      | 服务端高吞吐推理    | PagedAttention、Continuous Batching，GPU 上吞吐高 |
| sglang    | 服务端推理与结构化生成 | RadixAttention 复用前缀，擅长多轮和结构化输出              |
| llama.cpp | 本地 / 端侧轻量推理 | C/C++，支持 CPU 与多种硬件，GGUF 量化格式                |
| ollama    | 本地一键运行      | 封装 llama.cpp，提供简单的命令行与 API                  |
| MNN-LLM   | 移动端 / 端侧    | 阿里 MNN 框架的 LLM 推理，面向手机等设备                   |

表中：

  - **PagedAttention / RadixAttention**：分别是分页管理 KV Cache、用基数树复用相同前缀的技术
  - **GGUF**：llama.cpp 使用的模型文件与量化格式
  - 对比结论：服务端高并发选 vllm / sglang，个人电脑和端侧选 llama.cpp / ollama /
    MNN-LLM；指标含义见 [LLMs
    Metrics](https://github.com/junxnone/aiwiki/issues/503)

## 相关补充

  - 模型仓库与下载：Hugging Face、ModelScope（魔搭）
  - 应用开发框架：LangChain、LlamaIndex、Dify，常用于 RAG（见
    [RAG](https://github.com/junxnone/aiwiki/issues/461)）
  - Intel 平台推理：OpenVINO GenAI
