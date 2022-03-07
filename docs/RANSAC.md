---
Title | RANSAC
-- | --
Create Date | `2022-03-07T02:43:11Z`
Update Date | `2022-03-07T03:08:38Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/293)

---

## Brief
- RANSAC - `RANdom SAmple Consensus` - 随机抽样一致
- 假设：数据由正常数据(inliers)和噪声(outliers)组成
  - **随机性** 根据正确数据出现概率随机选取抽样数据 
  - **假设性**  假设选取的数据都是正确数据
- **应用** 直线拟合/平面拟合/图像点云配准

## 直线拟合

带噪声的数据 | RANSAC 拟合
-- | --
![image](https://user-images.githubusercontent.com/2216970/156961144-fccbc23c-d1c2-4404-a2b2-62ec94cdf064.png) | ![image](https://user-images.githubusercontent.com/2216970/156961163-507c657c-a48a-4786-a146-54a56b3d4aa6.png)


