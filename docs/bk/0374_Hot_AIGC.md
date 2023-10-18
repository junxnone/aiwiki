-----

| Title     | Hot AIGC                                              |
| --------- | ----------------------------------------------------- |
| Created @ | `2023-02-03T07:46:02Z`                                |
| Updated @ | `2023-10-18T06:35:04Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/374) |

-----

# AIGC

  - AIGC: `AI Generated Content` 利用 AI 生成内容 - 绘画/写作/...
      - PGC: `Professional Generated Content` 专业平台或组织生成的内容，
        电视/电影/海报/网剧/...
      - UGC: `User Generated Content` 用户个体生成的内容，个人vlog/blog/...

<!-- end list -->

``` mermaid

graph TD
    T(Text) --> A(Audio)
    T --> I(Image)
    I --> I
    T --> D(3D)
    T --> V(Video)
    I --> T
    T --> C(Code)
    T --> T
    T --> S(Science)
```

![image](media/849b5f99ff876806d1064bdd3f965e598c51eeb2.png)

## 相关工具

  - DALL-E (V1/V2)
  - Disco Diffusion
  - MidJourney
  - Stable Diffusion (V1/V2)

<!-- end list -->

``` mermaid
   %%{init: { 'logLevel': 'debug', 'theme': 'base', 'timeline': {'disableMulticolor': true}}}%%
    timeline
        title History of AIGC
            OpenAI  :  2021.01 DALL-E & CLIP 
                    : 2022.04 DALL-E 2
                    : 2022.11 chatGPT
                    : 2023.03 GPT4
            Disco Diffusion : 2021.10 v1 
                            : 2022.02 v5
            MidJourney  : 2022.02 MidJourney v1 
                        : 2022.07 MidJourney v3
                        : 2023.03  MidJourney v5
            Stable Diffusion    : 2022.08 v1 
                                : 2022.11 v2      
```

## Reference

  - [人工智能系列深度报告：AIGC行业综述篇](https://github.com/junxnone/aiwiki/files/11518064/AIGC.pdf)
  - [Disco Diffusion](https://github.com/alembics/disco-diffusion)
  - [CLIP](https://github.com/openai/CLIP)
  - [Stable Diffusion](https://github.com/Stability-AI/stablediffusion)
  - [Midjourney](https://www.midjourney.com/home/)
  - [ChatGPT is not all you need. A State of the Art Review of large
    Generative AI models](https://arxiv.org/pdf/2301.04655.pdf)
  - [AI内容生成](https://www.zhangzhenhu.com/aigc/index.html)
