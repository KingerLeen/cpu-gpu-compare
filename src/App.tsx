import { Tabs } from "antd";
import CPU from "./cpu/CPU";
import GPU from "./gpu/GPU";

function App() {
  return (
    <div className="w-screen h-screen py-2 px-4 overflow-auto relative">
      <div className="flex justify-center items-center pt-1 pb-3 text-xl text-gray-500">
        二手价对比, 数据来源于咸鱼，仅供参考
      </div>
      <Tabs centered type="card">
        <Tabs.TabPane tab="GPU对比" key="gpu">
          <GPU />
        </Tabs.TabPane>
        <Tabs.TabPane tab="CPU对比" key="cpu">
          <CPU />
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
}

export default App;
