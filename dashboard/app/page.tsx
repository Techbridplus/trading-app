"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";

interface RiskUpdate {
  accountId: string;
  status: string;
  equity: number;
  balance: number;
  dailyBase: number;
  initialBalance: number;
  dailyLimit: number;
  totalLimit: number;
  timestamp: string;
}

export default function Home() {
  const [connected, setConnected] = useState(false);
  const [data, setData] = useState<RiskUpdate | null>(null);

  useEffect(() => {
    const socket = io("http://localhost:4001");

    socket.on("connect", () => {
      console.log("Connected to server");
      setConnected(true);

      socket.emit("join-account", "acc_1771588437738");
    });

    socket.on("risk-update", (update: RiskUpdate) => {
      setData(update);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from server");
      setConnected(false);
    });

    socket.on("connect_error", (error) => {
      console.error("Connection error:", error);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  if (!connected) {
    return (
      <div className="h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="text-2xl mb-4">Connecting to server...</div>
          <div className="text-gray-400">localhost:4001</div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="text-2xl mb-4">✓ Connected</div>
          <div className="text-gray-400 mb-4">Waiting for risk updates...</div>
          <div className="text-sm text-gray-500">
            Account: acc_1771588437738
          </div>
          <div className="text-xs text-gray-600 mt-4">
            (Send events via /events endpoint)
          </div>
        </div>
      </div>
    );
  }

  const isLocked = data.status.includes("LOCKED");

  const dailyUsage =
    ((data.dailyBase - data.equity) / data.dailyBase) * 100;

  const totalUsage =
    ((data.initialBalance - data.equity) / data.initialBalance) * 100;

  const dailyFill =
    (dailyUsage / data.dailyLimit) * 100;

  const totalFill =
    (totalUsage / data.totalLimit) * 100;

  function getBarColor(fill: number) {
    if (fill >= 100) return "bg-red-700";
    if (fill >= 80) return "bg-red-500";
    if (fill >= 50) return "bg-yellow-400";
    return "bg-green-500";
  }

  if (isLocked) {
    return (
      <div className="h-screen bg-black text-white flex flex-col items-center justify-center text-center px-10">

        <div className="text-6xl font-extrabold bg-red-600 px-10 py-5 rounded-2xl mb-8 animate-pulse">
          ACCOUNT LOCKED
        </div>

        <div className="text-xl text-gray-400 max-w-xl">
          Daily loss limit breached.
          <br />
          Trading is disabled until reset.
          <br /><br />
          Take a break. Regain discipline.
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black text-white flex flex-col items-center justify-center px-10">

      <div className="text-5xl font-extrabold bg-green-500 text-black px-8 py-4 rounded-2xl mb-12 shadow-2xl">
        {data.status}
      </div>

      <div className="grid grid-cols-2 gap-20 text-center mb-16">
        <div>
          <div className="text-gray-400 text-lg mb-2">BALANCE</div>
          <div className="text-3xl font-bold">
            ₹ {data.balance.toFixed(2)}
          </div>
        </div>
        <div>
          <div className="text-gray-400 text-lg mb-2">EQUITY</div>
          <div className="text-3xl font-bold">
            ₹ {data.equity.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="w-full max-w-3xl mb-12">
        <div className="flex justify-between mb-2 text-sm">
          <span>Daily Loss Usage</span>
          <span>
            {dailyUsage.toFixed(2)}% / {data.dailyLimit}%
          </span>
        </div>

        <div className="w-full bg-gray-800 rounded-full h-8 overflow-hidden">
          <div
            className={`h-8 transition-all duration-500 ${getBarColor(dailyFill)}`}
            style={{ width: `${Math.min(dailyFill, 100)}%` }}
          />
        </div>
      </div>

      <div className="w-full max-w-3xl">
        <div className="flex justify-between mb-2 text-sm">
          <span>Total Drawdown Usage</span>
          <span>
            {totalUsage.toFixed(2)}% / {data.totalLimit}%
          </span>
        </div>

        <div className="w-full bg-gray-800 rounded-full h-8 overflow-hidden">
          <div
            className={`h-8 transition-all duration-500 ${getBarColor(totalFill)}`}
            style={{ width: `${Math.min(totalFill, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}