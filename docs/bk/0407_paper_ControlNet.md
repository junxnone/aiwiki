-----

| Title     | paper ControlNet                                      |
| --------- | ----------------------------------------------------- |
| Created @ | `2023-06-02T07:16:30Z`                                |
| Updated @ | `2023-06-05T03:32:25Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/407) |

-----

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

-----

<details>
<summary>Input Demo</summary>

| Input                 | Demo                                                         |
| --------------------- | ------------------------------------------------------------ |
| Canny Edge            | ![image](media/53f7925c474199a5e6c9c3a77e2d9a6a995af3ae.png) |
| M-LSD Lines           | ![image](media/e8b0d7aaf19e68deaf4cd9a5ab8e5cff49982e74.png) |
| HED Boundary          | ![image](media/c7c7feb286a1af7c197ee9b1130ccd7504774ca3.png) |
| User Scribbles        | ![image](media/894d46e0698519ef99b32d25bb950c5c5abb8c00.png) |
| Fake Scribbles        | ![image](media/40ce21da93f992a2678d5d4a8ef13343f0ed3e07.png) |
| Human Pose            | ![image](media/73d82a1573ae2f153e93f460af2c157fee164dd4.png) |
| Semantic Segmentation | ![image](media/28c892b0cbcfc06b1c2b056702e281d32f137dbf.png) |
| Depth                 | ![image](media/fe120fd79f1beda08a0532f4e62c92b4ff57c2a3.png) |
| Normal Map            | ![image](media/7f866dc9b774a411381107e205bdb79321822f7d.png) |
| Anime Line Drawing    | ![image](media/5544b107fc412c0b81045d506b7beb680ef2f04c.png) |

</details>

## Arch

![image](media/cff6e50226b23ea9b86d6f7a5064b3436acae164.png)

## Reference

  - paper 2023 **ControlNet** [Adding Conditional Control to
    Text-to-Image Diffusion Models](https://arxiv.org/abs/2302.05543)
    \[[Code](https://github.com/lllyasviel/ControlNet/tree/main)\]
