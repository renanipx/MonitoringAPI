import React, { type ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  style?: React.CSSProperties;
}

export function Card({ children, className = "", onClick, style }: CardProps) {
  return <div className={`card ${className}`} onClick={onClick} style={style}>{children}</div>;
}

export function CardHeader({ children }: { children: ReactNode }) {
  return <div className="card-header">{children}</div>;
}

export function CardTitle({ children }: { children: ReactNode }) {
  return <h1>{children}</h1>;
}

export function CardDescription({ children }: { children: ReactNode }) {
  return <p className="card-subtitle">{children}</p>;
}
