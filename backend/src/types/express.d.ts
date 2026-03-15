declare namespace Express {
  export interface Request {
    user?: {
      id: number;
      fullName: string;
      email: string;
    };
  }
}

export {};