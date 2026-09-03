import React from "react";

const DashboardSkeleton = () => {
  return (
    <div className="teacher-dashboard-viewport animate-pulse">
      {/* Welcome Banner Skeleton */}
      <div className="h-28 w-full rounded-2xl bg-gray-200/80 mb-6" />

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm border border-gray-100"
          >
            <div className="h-12 w-12 rounded-xl bg-gray-200" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-20 rounded bg-gray-200" />
              <div className="h-6 w-12 rounded bg-gray-200" />
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions / Content Skeleton */}
      <div className="h-16 w-full rounded-2xl bg-gray-200/60 mb-6" />

      {/* Split Section Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-64 rounded-2xl bg-white p-6 shadow-sm border border-gray-100 space-y-4">
          <div className="h-5 w-36 rounded bg-gray-200" />
          <div className="h-14 w-full rounded-xl bg-gray-100" />
          <div className="h-14 w-full rounded-xl bg-gray-100" />
        </div>
        <div className="h-64 rounded-2xl bg-white p-6 shadow-sm border border-gray-100 space-y-4">
          <div className="h-5 w-32 rounded bg-gray-200" />
          <div className="h-10 w-full rounded-lg bg-gray-100" />
          <div className="h-10 w-full rounded-lg bg-gray-100" />
        </div>
      </div>
    </div>
  );
};

export default DashboardSkeleton;
