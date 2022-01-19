---
Title | Calamari Voting
-- | --
Create Date | `2020-06-09T06:29:36Z`
Update Date | `2022-01-19T10:23:10Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/202)

---
## Brief
- [ISRI analytic tools for alignment and voting](https://github.com/eddieantonio/ocreval)

##  Confidence Voter

Num | Steps 
-- | --
Input | 1 - Char List<br> 2 - `Alternatives` Char & Probability
1 | [synchronize](https://github.com/Calamari-OCR/calamari/blob/715ebcdd8672c72c39a533a49f01d4eb1b36a760/calamari_ocr/ocr/text_processing/text_synchronizer.py#L50)  alignment `string`  match 相同的 `substr` 
2 | 统计匹配的 `substr` 长度频率, 返回 `长度` 频率最大的 voters
3 | 统计 `alternatives` sum confidence , 找出最大 `confidence` char
Output | Voting Sequence


## Sequence_Voter
