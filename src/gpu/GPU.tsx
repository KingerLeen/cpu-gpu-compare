import { useLocalStorageState } from "ahooks";
import {
  Button,
  Checkbox,
  DatePicker,
  Input,
  InputNumber,
  message,
  Space,
  Table,
} from "antd";
import copy from "copy-to-clipboard";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import gpuData, { gpuDataVersion } from "./gpuData";

const code = `const d = [...document.querySelectorAll("div")]
  .filter((item) => item.id)
  .map((item) => {
    const str = item.innerText;
    const [i, name, vramAndTime, threeDMarkScore] = str?.split("\\n") || [];
    if (!i?.endsWith(".")) {
      return null;
    }
    let brand = "";
    if (name.toUpperCase().includes("NVIDIA")) {
      brand = "NVIDIA";
    } else if (name.toUpperCase().includes("AMD")) {
      brand = "AMD";
    } else if (name.toUpperCase().includes("AMD")) {
      brand = "AMD";
    } else if (name.toUpperCase().includes("INTEL")) {
      brand = "INTEL";
    } else if (name.toLowerCase().includes("radeon")) {
      brand = "AMD";
    }

    const vtList = vramAndTime.split("-").map((v) => v.trim());
    const vram = vtList[0].includes("System Shared")? "System Shared": vtList[0];
    const time = vtList[1];

    return {
      name,
      brand,
      vram,
      time,
      threeDMarkScore: parseInt(threeDMarkScore),
    };
  })
  .filter((item) => !!item);
console.log(JSON.stringify(d));`;

export type gpuType = {
  brand: "AMD" | "NVIDIA" | "INTEL"; // 品牌
  name: string; // gpu名称
  desc?: string; // 描述
  price?: number; // 价格，单位元
  vram: string; // 显存，单位GB
  threeDMarkScore: number; // 3DMark评分
  time?: string; // 发售时间
  priceUpdate?: number; // 价格更新时间
  scoreForPce?: number; // 性价比评分
};

const useDataSource = () => {
  const [dataVersion, setDataVersion] =
    useLocalStorageState<string>("gpu-data-version");
  useEffect(() => {
    if (dataVersion !== gpuDataVersion) {
      setDataVersion(gpuDataVersion);
      console.log("数据版本有更新");
    }
  }, [dataVersion, setDataVersion]);

  const [data, setData] = useLocalStorageState<gpuType[]>("gpu-data", {
    defaultValue: gpuData,
    listenStorageChange: true,
  });
  const addData = (newData: gpuType[]) => {
    setData((prev) => {
      const merged = [...(prev || [])];
      newData.forEach((newItem) => {
        const existsI = merged.findIndex((item) => item.name === newItem.name);
        if (existsI === -1) {
          merged.push(newItem);
        } else {
          merged[existsI] = { ...merged[existsI], ...newItem };
        }
      });
      return merged;
    });
  };

  const changePrice = (record: gpuType, price: number) => {
    setData((prev) => {
      const merged = [...(prev || [])];
      const existsI = merged.findIndex((item) => item.name === record.name);
      if (existsI !== -1) {
        merged[existsI] = {
          ...merged[existsI],
          price,
          priceUpdate: Date.now(),
        };
      }
      return merged.map((item) => {
        return {
          ...item,
          scoreForPce: item.price
            ? Math.floor((item.threeDMarkScore / item.price) * 100)
            : 0,
        };
      });
    });
  };

  const reset = () => {
    setData(
      gpuData.map((item) => {
        return {
          ...item,
          scoreForPce: item.price
            ? Math.floor((item.threeDMarkScore / item.price) * 100)
            : 0,
        };
      }),
    );
  };

  return {
    data: data,
    addData,
    changePrice,
    reset,
  };
};

function Price({ record }: { record: gpuType }) {
  const { changePrice } = useDataSource();
  const [editMode, setEditMode] = useState(false);
  const [dataInput, setDataInput] = useState<number | undefined>(record.price);

  return (
    <div
      className="w-full h-full cursor-pointer"
      onClick={() => {
        setEditMode(true);
      }}
    >
      {editMode ? (
        <div>
          <InputNumber
            size="small"
            value={dataInput}
            onChange={(v) => setDataInput(v || undefined)}
            onPressEnter={(e) => {
              e.stopPropagation();
              changePrice(record, dataInput || 0);
              setEditMode(false);
            }}
          />
          <Button
            size="small"
            type="primary"
            onClick={(e) => {
              e.stopPropagation();
              changePrice(record, dataInput || 0);
              setEditMode(false);
            }}
          >
            确定
          </Button>
        </div>
      ) : (
        <>{record.price ? record.price + " 元" : "-"}</>
      )}
    </div>
  );
}

const defaultMinTime = "2020-01-01";
export default function GPU() {
  const { data, addData, reset } = useDataSource();
  const [dataInput, setDataInput] = useState("");
  const [search, setSearch] = useState("");
  const [minScore, setMinScore] = useState(10000);
  const [minTime, setMinTime] = useState(dayjs(defaultMinTime));
  const [brands, setBrands] = useState(["AMD", "NVIDIA"]);

  const addDataFromInput = (input: string) => {
    if (!input) {
      return;
    }
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) {
        addData(parsed);
        message.success("数据添加成功");
        setDataInput("");
      } else {
        message.error("数据格式错误，应为数组");
      }
    } catch {
      message.error("数据格式错误，无法解析为JSON");
    }
  };

  useEffect(() => {
    console.log("data changed", data);
  }, [data]);

  return (
    <div>
      <Space size="small">
        <Button
          type="primary"
          onClick={() => {
            const copied = copy(code);
            if (copied) {
              message.success("已复制代码到剪贴板，前往3DMark官网获取GPU评分");
              setTimeout(() => {
                window.open(
                  "https://www.topcpu.net/cpu-r5/3dmark-time-spy",
                  "_blank",
                );
              }, 1000);
            }
          }}
        >
          前往3DMark Time Spy获取评分
        </Button>
        <div className="flex w-90">
          <Input
            value={dataInput}
            className="flex-1"
            onChange={(v) => {
              setDataInput(v.target.value || "");
            }}
            placeholder="粘贴获取到的GPU数据的JSON数组"
          ></Input>
          <Button type="primary" onClick={() => addDataFromInput(dataInput)}>
            添加数据
          </Button>
        </div>
        <Button type="primary" danger onClick={() => reset()}>
          重置数据
        </Button>
      </Space>

      <div className="mt-4">
        <Space size={"large"}>
          <Input
            value={search}
            className="flex-1"
            onChange={(v) => {
              setSearch(v.target.value || "");
            }}
            placeholder="搜索"
          ></Input>
          <div>
            最低性能&nbsp;
            <InputNumber
              value={minScore}
              onChange={(value) => setMinScore(value || 0)}
            />
          </div>
          <div>
            最迟发布&nbsp;
            <DatePicker.YearPicker
              value={minTime}
              onChange={(date) => setMinTime(date || dayjs(defaultMinTime))}
            />
          </div>
          <div>
            品牌&nbsp;
            <Checkbox.Group
              options={["AMD", "NVIDIA", "INTEL"]}
              value={brands}
              onChange={setBrands}
            />
          </div>
        </Space>
      </div>

      <div className="mt-4">
        <Table
          dataSource={data
            .filter((item) => {
              return item.threeDMarkScore >= minScore;
            })
            .filter((item) => {
              if (!minTime) {
                return true;
              }
              if (!item.time) {
                return false;
              }
              return dayjs(item.time).isAfter(minTime);
            })
            .filter((item) => {
              if (brands.length === 0) {
                return true;
              }
              return brands.includes(item.brand);
            })
            .filter((item) =>
              [
                item.name.toLowerCase(),
                item.brand.toLowerCase(),
                item.desc?.toLowerCase(),
                item.vram.toLowerCase(),
              ]
                .join("")
                .includes(search.toLowerCase()),
            )}
          pagination={false}
          rowKey={"name"}
          size="small"
          columns={[
            {
              title: "名称",
              dataIndex: "name",
              width: 200,
            },
            {
              title: "品牌",
              dataIndex: "brand",
              width: 70,
            },
            {
              title: "显存(GB)",
              sorter: (a, b) =>
                (a.vram.toLowerCase().includes("gb") ? 1024 : 1) *
                  (parseInt(a.vram) || 0) -
                (b.vram.toLowerCase().includes("gb") ? 1024 : 1) *
                  (parseInt(b.vram) || 0),
              dataIndex: "vram",
              width: 100,
            },
            {
              title: "发售时间",
              sorter: (a, b) =>
                (a.time ? dayjs(a.time).unix() : 0) -
                (b.time ? dayjs(b.time).unix() : 0),
              dataIndex: "time",
              width: 80,
            },
            {
              title: "3DMark评分",
              sorter: (a, b) => a.threeDMarkScore - b.threeDMarkScore,
              dataIndex: "threeDMarkScore",
              width: 80,
            },
            {
              title: "价格",
              sorter: (a, b) => (a.price || 0) - (b.price || 0),
              dataIndex: "price",
              width: 80,
              render: (_, r) => {
                return <Price record={r} />;
              },
            },
            {
              title: "性价比评分",
              sorter: (a, b) => (a.scoreForPce || 0) - (b.scoreForPce || 0),
              dataIndex: "scoreForPce",
              width: 80,
              render: (_, r) => {
                return (
                  <>
                    {r.scoreForPce ? r.scoreForPce : "-"}
                    {r.priceUpdate && (
                      <span className="text-gray-400 text-xs ml-2">
                        {dayjs(r.priceUpdate).diff(dayjs(), "day") +
                          1 +
                          "天内更新"}
                      </span>
                    )}
                  </>
                );
              },
            },
          ]}
        />
      </div>
    </div>
  );
}
