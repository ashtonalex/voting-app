import React from "react";

interface SkeletonBoxProps {
  width?: string;
  height?: string;
  className?: string;
}

export const SkeletonBox: React.FC<SkeletonBoxProps> = ({
  width = "w-full",
  height = "h-6",
  className = "",
}) => (
  <div
    className={`bg-gray-200 dark:bg-gray-700 ${width} ${height} rounded animate-pulse ${className}`}
  />
);

interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({
  lines = 3,
  className = "",
}) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <SkeletonBox key={i} height="h-4" />
    ))}
  </div>
);

export const SkeletonSpinner: React.FC<{
  size?: string;
  className?: string;
}> = ({ size = "h-8 w-8", className = "" }) => (
  <div className={`flex items-center justify-center ${className}`}>
    <svg
      className={`animate-spin text-gray-300 ${size}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  </div>
);
