import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./global.css";
import "dayjs/locale/zh-cn";
import dayjs from "dayjs";
import locale from "antd/locale/zh_CN";
import { ConfigProvider } from "antd";
dayjs.locale("zh-cn");

createRoot(document.getElementById("root")!).render(
  <ConfigProvider locale={locale}>
    <App />
  </ConfigProvider>
);
