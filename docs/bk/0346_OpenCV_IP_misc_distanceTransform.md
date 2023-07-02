-----

| Title         | OpenCV IP misc distanceTransform                      |
| ------------- | ----------------------------------------------------- |
| Created @     | `2020-09-24T06:12:08Z`                                |
| Last Modify @ | `2022-12-27T09:11:44Z`                                |
| Labels        | \`\`                                                  |
| Edit @        | [here](https://github.com/junxnone/aiwiki/issues/346) |

-----

# distanceTransform 处理区域粘连

    dst_img = cv2.distanceTransform(img, cv2.DIST_C, cv2.DIST_MASK_3)

| origin image                                                 | cv2.DIST\_C                                                  | cv2.DIST\_L1                                                 | cv2.DIST\_L2                                                 |
| ------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ |
| ![image](media/75f9e8273ae26f933027e2b5d3bb62b214738918.png) | ![image](media/691dc4e21a2ce29e588ec19abb65b6aba6c408a7.png) | ![image](media/127e0a0b656943c5c4c26b93beb07faf45c107c2.png) | ![image](media/4eb903128cb5beb84d25331904ffb271fc24d719.png) |
