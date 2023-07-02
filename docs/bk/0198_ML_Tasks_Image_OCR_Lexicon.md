-----

| Title         | ML Tasks Image OCR Lexicon                            |
| ------------- | ----------------------------------------------------- |
| Created @     | `2020-05-28T06:42:45Z`                                |
| Last Modify @ | `2022-12-24T13:00:15Z`                                |
| Labels        | \`\`                                                  |
| Edit @        | [here](https://github.com/junxnone/aiwiki/issues/198) |

-----

## Reference

  - [CharNet 中根据 Lexicon
    校正得到最近编辑距离的word](https://github.com/MalongTech/research-charnet/blob/da7416dc5aadb51224445381b305ad53b8c13489/charnet/modeling/postprocessing.py#L157-L198)

## Brief

校正识别到的 `text`

  - Lexicon-Free
  - Lexicon-based

| Name            | Description  |
| --------------- | ------------ |
| Lexicon-Free    | None Lexicon |
| Generic Lexicon |              |
| Week Lexicon    |              |
| Strong Lexicon  |              |

## CharNet Pipeline

  - input - `predict_text` + `lexicon`
  - 丢弃长度小于 `3` 的 text
  - 判断是否是只有字母组成
  - 如果 `text_score < 0.8` 返回 `None`
  - 如果 `text_score > 0.98` 直接返回 `text` 不校正
  - 如果 `0.8 < text_score < 0.98`, 则进行校正
      - 逐个对比 `Lexicon` 中的 `Text`
      - 如果存在编辑距离为 `0` 的 `Text`，直接返回 `text`
      - 否则取最小编辑距离
          - 如果最小编辑距离 `<=1` 则返回 最小编辑距离 `Text`
          - 最小编辑距离 `> 1` 返回 `None`
