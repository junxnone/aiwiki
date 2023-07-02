-----

| Title         | ML Tasks Image OCR Metrics                            |
| ------------- | ----------------------------------------------------- |
| Created @     | `2020-05-18T02:05:31Z`                                |
| Last Modify @ | `2022-12-24T13:00:43Z`                                |
| Labels        | \`\`                                                  |
| Edit @        | [here](https://github.com/junxnone/aiwiki/issues/190) |

-----

## Reference

  - [文本检测TIoU--metric](https://zhuanlan.zhihu.com/p/63541543)

## Brief

  - Frame Level
  - Character Level

## Character Level

### CER - Character Error Rate

| 来源       | 公式                                                           | Description                                                                                                                |
| -------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| Calamari | ![image](media/5eab2d2983dc1d4588908e691ab499fc14e72867.png) | \- ed - edit distance <br>- 分母为 sequences `s1` & `s2` 长度最大值<br> - 取值 \[0, 1\]                                              |
| ASR      | ![image](media/5dc93f76e81d08f00173ecb4b5303af5fea49f9b.png) | \- S（substitution）\*\* 表示替换的字符数目<br>- D（deletion）表示删除的字符数目<br>- I（insertion）表示插入的字符数目<br>- N 表示参考序列中字符总数 <br>- 取值 \[0, +∞) |

### WER - Word Error Rate
