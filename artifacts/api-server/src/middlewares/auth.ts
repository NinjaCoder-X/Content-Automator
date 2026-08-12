import { Request, Response, NextFunction } from "express";

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ error: "Unauthorized: Missing Authorization header" });
    return;
  }

  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    res.status(401).json({ error: "Unauthorized: Invalid Authorization scheme" });
    return;
  }

  const expectedToken = process.env.API_SECRET_TOKEN;

  if (!expectedToken) {
    // If the server is not configured with a token, deny all requests to protected routes
    res.status(500).json({ error: "Internal Server Error: Authentication not configured" });
    return;
  }

  if (token !== expectedToken) {
    res.status(401).json({ error: "Unauthorized: Invalid token" });
    return;
  }

  next();
};
