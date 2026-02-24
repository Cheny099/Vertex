import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import Settings from './Settings';

/**
 * /accounts
 * 这是一个“账户管理”入口（Dashboard 的齿轮会跳这里）。
 * 目前项目里账户管理 UI 已集成在 Settings 页面中，所以这里复用 Settings，
 * 并在进入时尽量滚动到“Accounts”区块。
 */
const Accounts = () => {
  const location = useLocation();

  useEffect(() => {
    // 默认滚到 id="accounts"（如果用户带 hash，则优先用 hash）
    const targetId = (location.hash || '#accounts').slice(1);
    // 由于 Settings 的内容是 React 渲染的，稍微延迟以确保 DOM 已生成
    const t = window.setTimeout(() => {
      const el = document.getElementById(targetId);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
    return () => window.clearTimeout(t);
  }, [location.hash]);

  return <Settings />;
};

export default Accounts;
