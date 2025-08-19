/**
 * Production-safe logger service
 * Replaces console.log with controllable logging levels
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'none';

class LoggerService {
  private isDevelopment = __DEV__ || process.env.NODE_ENV === 'development';
  private logLevel: LogLevel = this.isDevelopment ? 'debug' : 'error';
  
  private levels = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    none: 4
  };

  setLevel(level: LogLevel) {
    this.logLevel = level;
  }

  private shouldLog(level: LogLevel): boolean {
    return this.levels[level] >= this.levels[this.logLevel];
  }

  debug(...args: any[]) {
    if (this.shouldLog('debug')) {
      console.log('[DEBUG]', ...args);
    }
  }

  info(...args: any[]) {
    if (this.shouldLog('info')) {
      console.info('[INFO]', ...args);
    }
  }

  warn(...args: any[]) {
    if (this.shouldLog('warn')) {
      console.warn('[WARN]', ...args);
    }
  }

  error(...args: any[]) {
    if (this.shouldLog('error')) {
      console.error('[ERROR]', ...args);
    }
  }

  // For critical logs that should always appear
  critical(...args: any[]) {
    console.error('[CRITICAL]', ...args);
  }
}

export const Logger = new LoggerService();
export default Logger;