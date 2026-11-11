import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const envSocketUrl = (import.meta as any).env?.VITE_SOCKET_URL;
    let socketUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:5000";
    if (envSocketUrl && !envSocketUrl.includes("localhost") && !envSocketUrl.includes("127.0.0.1") && envSocketUrl.startsWith("http")) {
      socketUrl = envSocketUrl.replace(/\/$/, "");
    } else {
      // Publicado sin VITE_SOCKET_URL: el tiempo real va al mismo servidor que la API
      const envApiUrl = (import.meta as any).env?.VITE_API_URL;
      if (envApiUrl && envApiUrl.startsWith("http") && !envApiUrl.includes("localhost") && !envApiUrl.includes("127.0.0.1")) {
        socketUrl = new URL(envApiUrl).origin;
      }
    }
    const newSocket = io(socketUrl, {
      transports: ["websocket", "polling"],
      auth: (cb) => cb({ token: localStorage.getItem("goeats_token") }),
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    newSocket.on("connect", () => {
      console.log("[Socket] Connected to server:", newSocket.id);
      setIsConnected(true);
    });

    newSocket.on("disconnect", (reason) => {
      console.log("[Socket] Disconnected from server:", reason);
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [isAuthenticated, user?.id]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};
