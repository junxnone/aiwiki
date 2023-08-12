-----

| Title     | OpenCV HAL                                            |
| --------- | ----------------------------------------------------- |
| Created @ | `2023-08-10T14:40:37Z`                                |
| Updated @ | `2023-08-12T07:22:35Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/435) |

-----

# HAL - Universal Intrinsics

  - Universal Intrinsics `支持不同架构处理器的 SIMD 指令集`
      - X86: SSE/SSE2/SSE4.2/AVX2/AVX512
      - ARM: NEON
      - PowerPC: VSX
      - MIPS: MSA
  - 编译时集成？

## Reference

  - [Universal
    Intrinsics](https://docs.opencv.org/4.x/df/d91/group__core__hal__intrin.html)
  - [hal
    code](https://github.com/opencv/opencv/tree/master/modules/core/include/opencv2/core/hal)
