-----

| Title         | ML Tasks Image OCR SCAN                               |
| ------------- | ----------------------------------------------------- |
| Created @     | `2020-05-09T02:06:41Z`                                |
| Last Modify @ | `2022-12-24T13:04:24Z`                                |
| Labels        | \`\`                                                  |
| Edit @        | [here](https://github.com/junxnone/aiwiki/issues/191) |

-----

## Reference

  - [paper - 2018 - SCAN: Sliding Convolutional Attention Network for
    Scene Text Recognition](https://arxiv.org/pdf/1806.00578v1.pdf)

## Brief

  - Sliding Windows + CNN + Seq2Seq
  - Seq2Seq
      - Encoder
      - Decoder

## Arch

| Pipeline                                                     | Sliding                                                    |
| ------------------------------------------------------------ | ---------------------------------------------------------- |
| ![image](media/a8b17063c62a86847d6483a39a1135f3c6d6e8d2.png) | ![EG1](media/4de64f1d0785bb4c7df3fd0e5b6c18c4e0ea1163.gif) |

| CNN Extractor                                                | Convolutional Attention                                      |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| ![image](media/c346930aff9e549f3d79ea52733f94d78b096e30.png) | ![image](media/505d0dce43284576f0a3dd75c4a91953a4b29c20.png) |

## Input

  - Resize `Height = 32` Pad `Width = 256`
  - Sliding Windows
      - Multi-scales --\> 按比例 resize --\> multi-channel input
      - `32x32` - `32x40` - `32x48`
