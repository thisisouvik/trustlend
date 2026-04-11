"use client";

import { useMemo } from "react";
import { formatCurrency } from "@/lib/utils/formatting";

interface WalletCardProps {
  address: string | null;
  available: number;
  inLoansOrPools: number;
  pending: number;
  inLoansLabel?: string;
  compact?: boolean;
}

export function WalletCard({
  address,
  available,
  inLoansOrPools,
  pending,
  inLoansLabel = "In Loans",
  compact = false,
}: WalletCardProps) {
  const isConnected = Boolean(address);
  const shortAddress = useMemo(() => {
    if (!address) return "No wallet connected";
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  }, [address]);

  if (compact) {
    return (
      <article className="wallet-card-shell wallet-card-shell--compact">
        <div className="wallet-card-compact-head">
          <div className="wallet-card-topcopy">
            <span className={`wallet-status-indicator ${isConnected ? "wallet-status-active" : "wallet-status-inactive"}`} aria-hidden="true" />
            <div>
              <p className="wallet-card-title">Wallet {isConnected ? "Connected" : "Not Connected"}</p>
              <p className="wallet-card-subtitle">Address {shortAddress}</p>
            </div>
          </div>
          <button type="button" className="wallet-card-action">
            {isConnected ? "Disconnect" : "Connect Wallet"}
          </button>
        </div>

        <div className="wallet-card-compact-metrics">
          <div className="wallet-card-compact-metric">
            <span>Available</span>
            <strong>{formatCurrency(available)}</strong>
          </div>
          <div className="wallet-card-compact-metric">
            <span>{inLoansLabel}</span>
            <strong>{formatCurrency(inLoansOrPools)}</strong>
          </div>
          <div className="wallet-card-compact-metric">
            <span>Pending</span>
            <strong>{formatCurrency(pending)}</strong>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="wallet-card-shell">
      <div className="wallet-card-top">
        <div className="wallet-card-topcopy">
          <span className={`wallet-status-indicator ${isConnected ? "wallet-status-active" : "wallet-status-inactive"}`} aria-hidden="true" />
          <div>
            <p className="wallet-card-title">Wallet {isConnected ? "Connected" : "Not Connected"}</p>
            <p className="wallet-card-subtitle">{shortAddress}</p>
          </div>
        </div>
        <button type="button" className="wallet-card-action">
          {isConnected ? "Disconnect" : "Connect Wallet"}
        </button>
      </div>

      <div className="wallet-card-addressline">
        <span className="wallet-card-addresslabel">Wallet address</span>
        <span className="wallet-card-addressvalue">{shortAddress}</span>
      </div>

      <div className="wallet-card-grid">
        <div className="wallet-card-metric">
          <span>Available Balance</span>
          <strong>{formatCurrency(available)}</strong>
        </div>
        <div className="wallet-card-metric">
          <span>{inLoansLabel}</span>
          <strong>{formatCurrency(inLoansOrPools)}</strong>
        </div>
        <div className="wallet-card-metric">
          <span>Pending</span>
          <strong>{formatCurrency(pending)}</strong>
        </div>
      </div>
    </article>
  );
}
