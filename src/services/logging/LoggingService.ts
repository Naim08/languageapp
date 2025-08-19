/**
 * Logging Service - Centralized logging with different levels and optional remote reporting
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4,
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: string;
  data?: any;
  error?: Error;
}

export interface LoggingConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableRemote: boolean;
  maxLocalLogs: number;
  remoteEndpoint?: string;
}

class LoggingService {
  private static instance: LoggingService;
  private config: LoggingConfig;
  private localLogs: LogEntry[] = [];

  private constructor() {
    this.config = {
      level: __DEV__ ? LogLevel.DEBUG : LogLevel.WARN,
      enableConsole: __DEV__,
      enableRemote: !__DEV__,
      maxLocalLogs: 1000,
    };
  }

  public static getInstance(): LoggingService {
    if (!LoggingService.instance) {
      LoggingService.instance = new LoggingService();
    }
    return LoggingService.instance;
  }

  public configure(config: Partial<LoggingConfig>): void {
    this.config = { ...this.config, ...config };
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.config.level;
  }

  private formatMessage(level: LogLevel, message: string, context?: string): string {
    const levelName = LogLevel[level];
    const timestamp = new Date().toISOString().substr(11, 12); // HH:mm:ss.SSS
    const contextStr = context ? ` [${context}]` : '';
    return `${timestamp} ${levelName}${contextStr}: ${message}`;
  }

  private addToLocalLogs(entry: LogEntry): void {
    this.localLogs.push(entry);
    if (this.localLogs.length > this.config.maxLocalLogs) {
      this.localLogs.shift();
    }
  }

  private log(level: LogLevel, message: string, context?: string, data?: any, error?: Error): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context,
      data,
      error,
    };

    this.addToLocalLogs(entry);

    if (this.config.enableConsole) {
      const formattedMessage = this.formatMessage(level, message, context);
      
      switch (level) {
        case LogLevel.DEBUG:
          console.debug(formattedMessage, data || '');
          break;
        case LogLevel.INFO:
          console.info(formattedMessage, data || '');
          break;
        case LogLevel.WARN:
          console.warn(formattedMessage, data || '');
          break;
        case LogLevel.ERROR:
          console.error(formattedMessage, data || '', error || '');
          break;
      }
    }

    // TODO: Implement remote logging if needed
    if (this.config.enableRemote && this.config.remoteEndpoint) {
      this.sendToRemote(entry);
    }
  }

  private async sendToRemote(entry: LogEntry): Promise<void> {
    // Implement remote logging if needed (e.g., to Sentry, LogRocket, etc.)
    // For now, we'll skip this implementation
  }

  // Public logging methods
  public debug(message: string, context?: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, context, data);
  }

  public info(message: string, context?: string, data?: any): void {
    this.log(LogLevel.INFO, message, context, data);
  }

  public warn(message: string, context?: string, data?: any): void {
    this.log(LogLevel.WARN, message, context, data);
  }

  public error(message: string, context?: string, error?: Error, data?: any): void {
    this.log(LogLevel.ERROR, message, context, data, error);
  }

  // Utility methods
  public getLogs(): LogEntry[] {
    return [...this.localLogs];
  }

  public getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.localLogs.filter(entry => entry.level === level);
  }

  public clearLogs(): void {
    this.localLogs = [];
  }

  public exportLogs(): string {
    return JSON.stringify(this.localLogs, null, 2);
  }

  // Context-specific loggers
  public tts = {
    debug: (message: string, data?: any) => this.debug(message, 'TTS', data),
    info: (message: string, data?: any) => this.info(message, 'TTS', data),
    warn: (message: string, data?: any) => this.warn(message, 'TTS', data),
    error: (message: string, error?: Error, data?: any) => this.error(message, 'TTS', error, data),
  };

  public stt = {
    debug: (message: string, data?: any) => this.debug(message, 'STT', data),
    info: (message: string, data?: any) => this.info(message, 'STT', data),
    warn: (message: string, data?: any) => this.warn(message, 'STT', data),
    error: (message: string, error?: Error, data?: any) => this.error(message, 'STT', error, data),
  };

  public auth = {
    debug: (message: string, data?: any) => this.debug(message, 'AUTH', data),
    info: (message: string, data?: any) => this.info(message, 'AUTH', data),
    warn: (message: string, data?: any) => this.warn(message, 'AUTH', data),
    error: (message: string, error?: Error, data?: any) => this.error(message, 'AUTH', error, data),
  };

  public api = {
    debug: (message: string, data?: any) => this.debug(message, 'API', data),
    info: (message: string, data?: any) => this.info(message, 'API', data),
    warn: (message: string, data?: any) => this.warn(message, 'API', data),
    error: (message: string, error?: Error, data?: any) => this.error(message, 'API', error, data),
  };

  public nav = {
    debug: (message: string, data?: any) => this.debug(message, 'NAV', data),
    info: (message: string, data?: any) => this.info(message, 'NAV', data),
    warn: (message: string, data?: any) => this.warn(message, 'NAV', data),
    error: (message: string, error?: Error, data?: any) => this.error(message, 'NAV', error, data),
  };
}

export const logger = LoggingService.getInstance();
export default logger;