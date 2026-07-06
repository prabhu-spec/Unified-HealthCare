import "express";

declare global {
  namespace Express {
    interface User {
      scope?: string;
      [key: string]: any;
    }

    interface Request {
      token?: string;
      user?: User;
      tenantId?: string;
    }
  }
}

export {};
