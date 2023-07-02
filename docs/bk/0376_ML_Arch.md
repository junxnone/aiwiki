-----

| Title     | ML Arch                                               |
| --------- | ----------------------------------------------------- |
| Created @ | `2023-02-03T08:24:58Z`                                |
| Updated @ | `2023-02-03T08:24:58Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/376) |

-----

# ML 架构

``` mermaid

graph TD
    A[Inputs:Images/Text/Audio/Video] -->|Preprocessing| BT
    
    subgraph Model
        B(Init Model)
        B -->  BT[Training]
        BT--> |Tuning Model HyperParameters| BT
        BT --> BE(Final Model)
    end
    subgraph Result
    IC(Classification Result)
    ID(Detection Result)
    IS(Segmentation Result)
    E(QA)
    F(Generated Content)
    end
    BE --> |PostProcessing| Result

```
