---
Title | SCAN
-- | --
Create Date | `2020-05-09T02:06:41Z`
Update Date | `2022-01-19T09:36:06Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/191)

---
## Reference
- [paper - 2018 - SCAN: Sliding Convolutional Attention Network for Scene Text Recognition](https://arxiv.org/pdf/1806.00578v1.pdf)

## Brief
- Sliding Windows + CNN + Seq2Seq
- Seq2Seq
  - Encoder
  - Decoder

##  Arch

Pipeline | Sliding 
-- | --
![image](https://user-images.githubusercontent.com/2216970/85357160-4ac3be80-b543-11ea-81ce-82f133c4763c.png)|  ![EG1](https://user-images.githubusercontent.com/2216970/85356934-d0933a00-b542-11ea-9558-91f223658094.gif)

CNN Extractor | Convolutional Attention
-- | --
 ![image](https://user-images.githubusercontent.com/2216970/86071736-967de700-bab2-11ea-9409-fb9c7e9cd1cf.png) | ![image](https://user-images.githubusercontent.com/2216970/86073482-6b959200-bab6-11ea-801a-1a59926ad15f.png)



## Input
- Resize `Height = 32` Pad `Width = 256`
- Sliding Windows
  - Multi-scales --> 按比例 resize --> multi-channel input
  - `32x32` - `32x40` - `32x48`

