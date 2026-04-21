import React from "react";
import "../../styles/App.css";

export type StatusType = "ONLINE" | "OFFLINE" | "ACTIVE" | "ERROR" | "PENDING";

interface StatusBadgeProps {
  status: StatusType | string;
  label?: string;
  showDot?: boolean;
  className?: string;
}

export function StatusBadge({ 
  status, 
  label, 
  showDot = true, 
  className = "" 
}: StatusBadgeProps) {
  const normalizedStatus = status.toUpperCase() as StatusType;
  
  const getStatusClass = (s: StatusType) => {
    switch (s) {
      case "ONLINE": return "status-online";
      case "OFFLINE": return "status-offline";
      case "ACTIVE": return "status-active";
      case "ERROR": return "status-error";
      case "PENDING": return "status-pending";
      default: return "status-pending";
    }
  };

  const displayLabel = label || status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

  return (
    <span className={`status-badge ${getStatusClass(normalizedStatus)} ${className}`}>
      {showDot && <span className="status-dot"></span>}
      {displayLabel}
    </span>
  );
}
