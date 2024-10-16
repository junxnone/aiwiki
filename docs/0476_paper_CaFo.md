---
Title | paper CaFo
-- | --
Created @ | `2024-10-11T01:52:10Z`
Updated @| `2024-10-16T09:11:10Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/476)

---

# CaFo
- 分别利用 GPT-3/CLIP/DINO/DALL-E 从 Prompt/Generate/CacheModel 方面提升模型性能



## Arch
- 1 利用 GPT-3 生成更丰富语义的 Prompt
- 2 利用 DALL-E 生成 Prompt 相关的 Image
- 3 将生成的 Image 和 Training Image 使用 CLIP & DINO 生成 Cache Model
- 4 **Inference** 测试图片通过 CLIP & DINO 生成查询 keys, 从 Cache Model 中获取 ensemble 结果


![image](https://github.com/user-attachments/assets/accd8ed3-46da-49a8-a712-5dab0794228e)

![image](https://github.com/user-attachments/assets/d5197fb2-293f-4778-bdaf-fc3bc9762bec)
![image](https://github.com/user-attachments/assets/ee4df7a8-d3d2-42c8-93ac-8bdd482c9283)
![image](https://github.com/user-attachments/assets/47ecad70-1fe9-442f-96fd-321a0c1e5b93)


## Reference

- [Prompt, Generate, then Cache: Cascade of Foundation Models makes Strong Few-shot Learners](https://arxiv.org/abs/2303.02151)
- [Code](https://github.com/OpenGVLab/CaFo)

