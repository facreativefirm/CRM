import * as React from "react";
import { cn } from "@/lib/utils";

import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DataTableProps<T> {
    columns: {
        header: string;
        accessorKey: keyof T;
        cell?: (item: T) => React.ReactNode;
    }[];
    data: T[];
    loading?: boolean;
    className?: string;
    pagination?: boolean;
    pageSize?: number;
}

export function DataTable<T>({ columns, data, loading, className, pagination = false, pageSize = 10 }: DataTableProps<T>) {
    const [currentPage, setCurrentPage] = React.useState(1);

    // Reset to page 1 if data changes significantly (optional, but good practice when filtering)
    React.useEffect(() => {
        setCurrentPage(1);
    }, [data.length]);

    const totalPages = Math.ceil(data.length / pageSize);

    const paginatedData = React.useMemo(() => {
        if (!pagination) return data;
        const start = (currentPage - 1) * pageSize;
        return data.slice(start, start + pageSize);
    }, [data, currentPage, pageSize, pagination]);

    const handlePrevious = () => {
        setCurrentPage(p => Math.max(1, p - 1));
    };

    const handleNext = () => {
        setCurrentPage(p => Math.min(totalPages, p + 1));
    };

    return (
        <div className={cn("w-full flex flex-col gap-4", className)}>
            <div className="w-full overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-secondary/30 text-muted-foreground">
                        <tr>
                            {columns.map((col, i) => (
                                <th key={i} className="px-6 py-4 font-bold">
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-medium">
                        {loading ? (
                            <tr>
                                <td colSpan={columns.length} className="px-6 py-12 text-center text-muted-foreground italic">
                                    <div className="flex flex-col items-center gap-3">
                                        <Loader2 className="animate-spin" size={24} />
                                        <span>Syncing records...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : paginatedData.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="px-6 py-12 text-center text-muted-foreground italic">
                                    No records found.
                                </td>
                            </tr>
                        ) : (
                            paginatedData.map((item, rowIdx) => (
                                <tr key={rowIdx} className="hover:bg-accent/10 transition-all duration-200">
                                    {columns.map((col, colIdx) => (
                                        <td key={colIdx} className="px-6 py-4 whitespace-nowrap">
                                            {col.cell ? col.cell(item) : (item[col.accessorKey] as React.ReactNode)}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {pagination && !loading && data.length > pageSize && (
                <div className="flex items-center justify-between px-2">
                    <p className="text-xs text-muted-foreground font-medium">
                        Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, data.length)} of {data.length} entries
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 rounded-lg border-white/10"
                            onClick={handlePrevious}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft size={14} />
                        </Button>
                        <span className="text-xs font-bold px-2">
                            Page {currentPage} of {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 rounded-lg border-white/10"
                            onClick={handleNext}
                            disabled={currentPage === totalPages}
                        >
                            <ChevronRight size={14} />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
