import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import '@fortawesome/fontawesome-free/css/all.min.css';
import { installFetchInterceptor } from "./utils/api";

// アプリ起動前にグローバル fetch インターセプターを設置
// 全コンポーネントの fetch に自動で JWT Authorization ヘッダーを付与する
installFetchInterceptor();

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
