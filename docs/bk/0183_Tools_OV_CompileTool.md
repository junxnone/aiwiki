-----

| Title     | Tools OV CompileTool                                  |
| --------- | ----------------------------------------------------- |
| Created @ | `2021-01-25T10:07:40Z`                                |
| Updated @ | `2026-10-21T02:00:23Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/183) |

-----

# Compile Tool

  - Convert xml to blob format

<!-- end list -->

    compile_tool -m model.xml -d MYRIAD -il NCHW

    Inference Engine:
            API version ............ 2.1
            Build .................. 2021.1.0-1237-bece22ac675-releases/2021/1
            Description ....... API
    [Warning][VPU][Config] Deprecated option was used : VPU_MYRIAD_PLATFORM
    Done. LoadNetwork time elapsed: 7202 ms

    model.blob

> ?? `-il <value> Optional. Specifies layout for all input layers of the
> network.`

## Reference

  - [Compile
    Tool](https://docs.openvinotoolkit.org/latest/openvino_inference_engine_tools_compile_tool_README.html)
