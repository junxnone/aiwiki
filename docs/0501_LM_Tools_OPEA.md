---
Title | LM Tools OPEA
-- | --
Created @ | `2025-02-08T07:52:04Z`
Updated @| `2026-11-26T10:23:54Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/501)

---
# OPEA
 
- OPEA - `Open Platform for Enterprise AI` 
- `LF AI & Data` 基金会 `2024.4` 推出的促进 AI 开放的项目, 一些大公司参与开发 (包括 Cloudera、Intel、Red Hat、Hugging Face、Domino Data Lab、MariaDB 和 VMware 等企业)
-  [opea.dev](https://opea.dev/)
- 目前定位是基于 LLM/LMM 的开源的企业级 RAG 系统 [Github Code](https://github.com/opea-project)
- 支持不同的 Inference Device (Xeon/Gaudi2/Nvidia)
- 三大部分
  - GenAIComps - 提供微服务
  - GenAIInfra - 用于部署
  - GenAIEval - 用于评估性能，准确性，安全性等 
- 功能: QA/RAG/SearchQA/VisualQnA, CodeGen/Trans, DocSum, LanguageTranslation, [Supported Examples](https://opea-project.github.io/latest/GenAIExamples/supported_examples.html)
- 一系列的微服务: ASR/DataPreprocessing/Embedding/Guardrails(security)/KG/LLM/LVM/TTS/Agent/VectorDB/...
- 部署方式: Docker Image Examples/Kubernetes 



## 架构 & Pipeline

```mermaid
flowchart LR
    U[用户 请求] --> G[网关 / 编排 GenAIComps 微服务]
    G --> E[Embedding]
    E --> V[(VectorDB)]
    V --> R[Retriever / Reranker]
    R --> L[LLM 推理服务]
    L --> A[回答]
```

图中：这是 OPEA 中典型 RAG（ChatQnA）流水线的示意：每个方框是一个独立的微服务，由编排层串联；问题经 Embedding、向量库检索、重排后交给 LLM 生成回答。下面的三张图为原文档附带的官方架构与流程图。

## 三大部分

| 部分 | 作用 |
| --- | --- |
| GenAIComps | 提供可组合的微服务（Embedding、LLM、向量库、Guardrails 等） |
| GenAIInfra | 部署相关，如 Docker、Kubernetes 配置 |
| GenAIEval | 评估性能、准确性、安全性 |

表中：对比结论：GenAIComps 是积木，GenAIExamples 把积木拼成完整应用，GenAIInfra 负责部署，GenAIEval 负责评估。RAG 的原理见 [RAG](https://github.com/junxnone/aiwiki/issues/461)。




![Image](https://github.com/user-attachments/assets/7abbb352-fe60-4831-83f0-169ea425b97d)



![Image](https://github.com/user-attachments/assets/b74e1c3c-eb3d-4e86-a756-88a5b4899469)



![Image](https://github.com/user-attachments/assets/a1d47111-6769-44eb-be29-b2be4fa4a93d)




