"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils/formatting";

interface WalletCardProps {
  address: string | null;
  available: number;
  inLoansOrPools: number;
  pending: number;
  inLoansLabel?: string;
}

export function WalletCard({
  address,
  available,
  inLoansOrPools,
  pending,
  inLoansLabel = "In Loans",
}: WalletCardProps) {
  const [showHistory, setShowHistory] = useState(false);

  return (
    <article className="workspace-card crypto-wallet-card">
      <div className="wallet-card-header">
        <h2 className="workspace-card-title wallet-title">Your Stellar Wallet</h2>
        <div className="wallet-chip-status">
          {address ? (
            <span className="wallet-status-indicator wallet-status-active"></span>
          ) : (
            <span className="wallet-status-indicator wallet-status-inactive"></span>
          )}
          {address ? "Connected" : "Not connected"}
        </div>
      </div>

      <p className="wallet-address font-mono">
        {address ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}` : "No active wallet"}
      </p>

      <div className="wallet-balance-wrap">
        <p className="wallet-balance-label">Available Balance</p>
        <p className="wallet-balance-amount font-display">{formatCurrency(available)}</p>
      </div>

      <div className="wallet-stats">
        <div className="wallet-stat">
          <span>{inLoansLabel}</span>
          <strong>{formatCurrency(inLoansOrPools)}</strong>
        </div>
        <div className="wallet-stat">
          <span>Pending</span>
          <strong>{formatCurrency(pending)}</strong>
        </div>
      </div>

      <div className="workspace-inline-actions wallet-actions">
        {address ? (
          <button type="button" className="workspace-btn-primary">Disconnect</button>
        ) : (
          <button type="button" className="workspace-btn-primary">Connect Wallet</button>
        )}
      </div>

      <div className="wallet-history-section">
        <button
          type="button"
          className="wallet-history-toggle"
          onClick={() => setShowHistory(!showHistory)}
        >
          {showHistory ? "Hide Transaction History" : "View Transaction History"}
          <svg
            className={`wallet-history-icon ${showHistory ? "rotate" : ""}`}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>

        {showHistory && (
          <div className="wallet-history-list">
             {/* Mock history just for the UI presentation */}
             <div className="wallet-history-item">
               <div className="wallet-history-info">
                 <span className="wallet-history-type deposit">Deposit</span>
                 <span className="wallet-history-date">Today at 10:42 AM</span>
               </div>
               <div className="wallet-history-amount positive">
                 +{formatCurrency(500)}
                 <a href="#" className="wallet-verify-link" title="Verify on Stellar block explorer">🔗 Verify</a>
               </div>
             </div>
             <div className="wallet-history-item">
               <div className="wallet-history-info">
                 <span className="wallet-history-type withdrawal">Withdrawal</span>
                 <span className="wallet-history-date">Yesterday at 14:20 PM</span>
               </div>
               <div className="wallet-history-amount negative">
                 -{formatCurrency(150)}
                 <a href="#" className="wallet-verify-link" title="Verify on Stellar block explorer">🔗 Verify</a>
               </div>
             </div>
             <div className="wallet-history-item">
               <div className="wallet-history-info">
                 <span className="wallet-history-type deposit">Loan Funded</span>
                 <span className="wallet-history-date">Apr 8, 2026</span>
               </div>
               <div className="wallet-history-amount positive">
                 +{formatCurrency(1200)}
                 <a href="#" className="wallet-verify-link" title="Verify on Stellar block explorer">🔗 Verify</a>
               </div>
             </div>
          </div>
        )}
      </div>
    </article>
  );
}
