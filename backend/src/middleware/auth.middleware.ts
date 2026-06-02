import type { IncomingMessage } from "http";
import { verifyToken, type TokenPayload } from "../services/auth.service.js";

/**
 * Extract and verify the JWT from a WebSocket upgrade request.
 * Clients must pass the token in the Sec-WebSocket-Protocol header.
 * Returns the decoded payload or throws on failure.
 */
export function authenticateWsRequest(request: IncomingMessage): TokenPayload {
  const protocolHeader = request.headers["sec-websocket-protocol"];
  
  let token: string | undefined;
  if (protocolHeader) {
    // The header can be a comma-separated list if multiple protocols are sent
    const protocols = protocolHeader.split(",").map(p => p.trim());
    token = protocols[0];
  }

  if (!token) {
    throw new Error("No token provided in Sec-WebSocket-Protocol header.");
  }

  return verifyToken(decodeURIComponent(token));
}
