import * as fs from "fs";
import * as path from "path";

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  details?: Record<string, unknown>;
}

class Logger {
  private logFile: string = "/tmp/jwt-verifier-mcp.log";
  private maxFileSize: number = 10 * 1024 * 1024; // 10 MB
  private maxFiles: number = 5;

  constructor() {
    this.ensureLogDirectory();
  }

  private ensureLogDirectory(): void {
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  private getTimestamp(): string {
    return new Date().toISOString();
  }

  private rotateLogIfNeeded(): void {
    try {
      if (fs.existsSync(this.logFile)) {
        const stats = fs.statSync(this.logFile);
        if (stats.size > this.maxFileSize) {
          for (let i = this.maxFiles - 1; i > 0; i--) {
            const oldFile = `${this.logFile}.${i}`;
            const newFile = `${this.logFile}.${i + 1}`;
            if (fs.existsSync(oldFile)) {
              fs.unlinkSync(oldFile);
            }
            if (fs.existsSync(oldFile)) {
              fs.renameSync(oldFile, newFile);
            }
          }
          fs.renameSync(this.logFile, `${this.logFile}.1`);
        }
      }
    } catch (error) {
      console.error("Log rotation failed:", error);
    }
  }

  private writeToFile(entry: LogEntry): void {
    try {
      this.rotateLogIfNeeded();
      const logLine = JSON.stringify(entry) + "\n";
      fs.appendFileSync(this.logFile, logLine, "utf-8");
    } catch (error) {
      console.error("Failed to write to log file:", error);
    }
  }

  private log(level: string, message: string, details?: Record<string, unknown>): void {
    const entry: LogEntry = {
      timestamp: this.getTimestamp(),
      level,
      message,
      ...(details && { details }),
    };

    this.writeToFile(entry);
    console.log(`[${level}] ${message}`, details || "");
  }

  debug(message: string, details?: Record<string, unknown>): void {
    this.log("DEBUG", message, details);
  }

  info(message: string, details?: Record<string, unknown>): void {
    this.log("INFO", message, details);
  }

  warn(message: string, details?: Record<string, unknown>): void {
    this.log("WARN", message, details);
  }

  error(message: string, details?: Record<string, unknown>): void {
    this.log("ERROR", message, details);
  }
}

export const logger = new Logger();
