type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const isDev = import.meta.env.DEV;

const write = (level: LogLevel, ...args: unknown[]) => {
  if (level === 'debug' || level === 'info') {
    if (!isDev) return;
  }

  const fn = console[level] as (...messages: unknown[]) => void;
  fn(...args);
};

export const logger = {
  debug: (...args: unknown[]) => write('debug', ...args),
  info: (...args: unknown[]) => write('info', ...args),
  warn: (...args: unknown[]) => write('warn', ...args),
  error: (...args: unknown[]) => write('error', ...args),
};

