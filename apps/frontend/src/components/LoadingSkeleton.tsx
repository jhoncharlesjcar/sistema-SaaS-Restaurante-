interface LoadingSkeletonProps {
    className?: string;
    rows?: number;
}

export function LoadingSkeleton({ className = '', rows = 3 }: LoadingSkeletonProps) {
    return (
        <div className={`space-y-3 ${className}`}>
            {Array.from({ length: rows }).map((_, index) => (
                <div
                    key={index}
                    className="h-12 bg-gray-200 rounded-lg animate-skeleton"
                />
            ))}
        </div>
    );
}

interface CardSkeletonProps {
    className?: string;
}

export function CardSkeleton({ className = '' }: CardSkeletonProps) {
    return (
        <div className={`border rounded-lg p-4 ${className}`}>
            <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded animate-skeleton w-3/4" />
                <div className="h-4 bg-gray-200 rounded animate-skeleton w-1/2" />
                <div className="h-8 bg-gray-200 rounded animate-skeleton w-full" />
            </div>
        </div>
    );
}

interface TableSkeletonProps {
    rows?: number;
    columns?: number;
}

export function TableSkeleton({ rows = 5, columns = 4 }: TableSkeletonProps) {
    return (
        <div className="space-y-2">
            {/* Header */}
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
                {Array.from({ length: columns }).map((_, index) => (
                    <div key={`header-${index}`} className="h-8 bg-gray-300 rounded animate-skeleton" />
                ))}
            </div>

            {/* Rows */}
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <div
                    key={`row-${rowIndex}`}
                    className="grid gap-4"
                    style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
                >
                    {Array.from({ length: columns }).map((_, colIndex) => (
                        <div
                            key={`cell-${rowIndex}-${colIndex}`}
                            className="h-12 bg-gray-200 rounded animate-skeleton"
                        />
                    ))}
                </div>
            ))}
        </div>
    );
}
