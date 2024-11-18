-----

| Title     | Datasets Image2D Detection BBox                       |
| --------- | ----------------------------------------------------- |
| Created @ | `2024-11-18T09:08:11Z`                                |
| Updated @ | `2024-11-18T09:08:11Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/488) |

-----

# BBox Format

  - **Pascal VOC** - `[x_min, y_min, x_max, y_max]`
  - **COCO** - `[x_min, y_min, width, height]`
  - **YOLO** - `[x_center, y_center, width, height]` **& Normalized**
    `[0,1]`
  - **Albumentations** - `[x_min, y_min, x_max, y_max]` **& Normalized**
    `[0,1]`

## Examples

  - **Pascal VOC** - `[98, 345, 420, 462]`
  - **COCO** - `[98, 345, 322, 117]`
  - **YOLO** - `[((420 + 98) / 2) /640, ((462 + 345) / 2) /480, 322
    /640, 117 /480]` =\> `[0.4046875, 0.840625, 0.503125, 0.24375]`
  - **Albumentations** - `[98 /640, 345 /480, 420 /640, 462 /480]` =\>
    `[0.153125, 0.71875, 0.65625, 0.9625]`

![image](media/c2aae9e778c8747c356a7d308bd93f1bddc4f4c8.png)
