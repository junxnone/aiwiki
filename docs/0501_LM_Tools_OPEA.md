---
Title | LM Tools OPEA
-- | --
Created @ | `2025-02-08T07:52:04Z`
Updated @| `2025-02-08T07:52:04Z`
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



![Image](https://github.com/user-attachments/assets/7abbb352-fe60-4831-83f0-169ea425b97d)



![Image](https://github.com/user-attachments/assets/b74e1c3c-eb3d-4e86-a756-88a5b4899469)



![Image](https://github.com/user-attachments/assets/a1d47111-6769-44eb-be29-b2be4fa4a93d)



