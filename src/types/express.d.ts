// src/types/express.d.ts
import { Request } from "express";

declare global {
  namespace Express {
    interface Request {
      videoId?: string;
      fileValidatorError?: string;
    }
  }
}

export {};
