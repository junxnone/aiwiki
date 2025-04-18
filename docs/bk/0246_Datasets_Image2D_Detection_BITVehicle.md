-----

| Title     | Datasets Image2D Detection BITVehicle                 |
| --------- | ----------------------------------------------------- |
| Created @ | `2018-12-19T17:36:01Z`                                |
| Updated @ | `2024-11-18T08:56:13Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/246) |

-----

# BIT-Vehicle

  - **The BIT-Vehicle dataset contains 9,850 vehicle images.**

## Categories

![image](media/64c641c171e8681a5c8c2312d3ede70026937cfa.png)

  - Bus 558
  - Microbus 883
  - Minivan 476
  - Sedan 5,922
  - SUV 1,392
  - Truck 822

## Files

    ├── README.txt
    ├── vehicle_0000001.jpg
    ├      ...
    ├── vehicle_0009849.jpg
    ├── vehicle_0009850.jpg
    └── VehicleInfo.mat ==> matlab annotation information.

## Annotation information.

  - name: The filename of the image.
  - height: The height of the image.
  - wideth: The width of the image.
  - nvehicles: The number of the vehicles in the image.
  - vehicles: This field is a struct array with the size of 1\*n
    vehicles, and each element describes a vehicle. Each element
    contains five fileds: left, top, right, bottom, and category. The
    former four fileds characterize the location of the vehicle in the
    image, and the field "category" represents the type of the vehicle.

## Reference

  - [ BitVehicle](http://iitlab.bit.edu.cn/mcislab/vehicledb/)
  - 彩蛋 ctrl + u \~\~ [backup- BIT-Vehicle
    Dataset.html](https://github.com/zj2626/Vehicle_Type_Identification/blob/d7fa07cb687275da9a25157711d6f8e06fa0abfe/document/BIT-Vehicle%20Dataset.html)
