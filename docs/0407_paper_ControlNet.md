---
Title | paper ControlNet
-- | --
Created @ | `2023-06-02T07:16:30Z`
Updated @| `2023-06-05T03:32:25Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/407)

---
# ControlNet

- Control diffusion models
- 添加输入到 `Stable Diffusion` 中 控制生成内容
  - Canny Edge
  - M-LSD Lines
  - HED Boundary
  - User Scribbles
  - Fake Scribbles
  - Human Pose
  - Semantic Segmentation
  - Normal Map
  - Anime Line Drawing


----
<details>
<summary>Input Demo</summary>

Input | Demo
-- | -- 
Canny Edge | ![image](https://github.com/junxnone/aiwiki/assets/2216970/dcdd5a02-a35c-44b1-b6a2-b2825a9ddc42)
M-LSD Lines | ![image](https://github.com/junxnone/aiwiki/assets/2216970/d408fbf7-b4f8-4c0e-acad-cb7a05a5bc57)
HED Boundary | ![image](https://github.com/junxnone/aiwiki/assets/2216970/de32f0a5-fe3e-4430-8626-cd87a53f005d)
User Scribbles | ![image](https://github.com/junxnone/aiwiki/assets/2216970/a3676b96-7cc0-475f-b072-486236a58017)
Fake Scribbles | ![image](https://github.com/junxnone/aiwiki/assets/2216970/b6aa8a41-0ade-4ce2-a265-b880c1edd316)
Human Pose | ![image](https://github.com/junxnone/aiwiki/assets/2216970/c051e8b1-58d5-4403-a684-4499b3a392e5)
Semantic Segmentation | ![image](https://github.com/junxnone/aiwiki/assets/2216970/42d72420-e133-41d9-8d31-2704c0b686d5)
Depth | ![image](https://github.com/junxnone/aiwiki/assets/2216970/553bcdfe-f457-4bfe-a60b-1ec0d02209a5)
Normal Map | ![image](https://github.com/junxnone/aiwiki/assets/2216970/f5ff8345-c389-4afe-91e6-11d2f16dbcc5)
Anime Line Drawing | ![image](https://github.com/junxnone/aiwiki/assets/2216970/7409623f-2585-47a8-9829-9081a1de1371)

</details>



## Arch

![image](https://github.com/junxnone/aiwiki/assets/2216970/9297539c-fd83-4014-ab46-fb77c148bed9)

## Reference
- paper 2023 **ControlNet** [Adding Conditional Control to Text-to-Image Diffusion Models](https://arxiv.org/abs/2302.05543) [[Code](https://github.com/lllyasviel/ControlNet/tree/main)]
