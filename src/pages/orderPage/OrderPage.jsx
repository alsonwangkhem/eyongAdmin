import React from "react";
import { useNavigate } from "react-router-dom";
import { useOrders, useUpdatateOrderStatus } from "@/features/orders/hooks/useOrders";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { OrderStatus } from "@/constants";
import { Loader } from "@/components/common/loader";


export function OrderPage() {
  const navigate = useNavigate();
  const { data: orders = [], isLoading, error, refetch } = useOrders();
  const { mutate: updateStatus } = useUpdatateOrderStatus();
  const [sorting, setSorting] = React.useState([]);
  const [globalFilter, setGlobalFilter] = React.useState("");

  const handleStatusChange = (e, orderId, status) => {
    e.stopPropagation(); // Prevent row click when changing status
    if (!status) return;
    updateStatus(
      { orderId, status },
      {
        onSuccess: () => {
          refetch();
        },
      }
    );
  };

  const columns = [
    {
      accessorKey: "_id",
      header: "Order ID",
    },
    {
      accessorKey: "shipping_address.full_name",
      header: "Customer Name",
    },
    {
      accessorKey: "createdAt",
      header: "Order Date",
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
    },
    {
      accessorKey: "payment.status",
      header: "Payment Status",
      cell: ({ row }) => (
        <Badge
          variant={
            row.original.payment.status === "Pending" ? "warning" : "success"
          }
        >
          {row.original.payment.status}
        </Badge>
      ),
    },
    {
      accessorKey: "amount",
      header: "Total Amount",
      cell: ({ row }) => `₹${row.original.amount.toFixed(2)}`,
    },
    {
      accessorKey: "status",
      header: "Order Status",
      cell: ({ row }) => (
        <Select
          onValueChange={(status) =>
            handleStatusChange(event, row.original._id, status)
          }
        >
          <SelectTrigger>
            <SelectValue placeholder={row.original.status} />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(OrderStatus).map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
    },
  ];

  const table = useReactTable({
    data: orders,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (isLoading) return <Loader />
  if (error) return <p>Error loading orders: {error.message}</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">All Orders</h1>
        <Input
          placeholder="Search orders..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="rounded-lg border shadow-2xl">
        <Table>
          <TableHeader className="bg-gray-200">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : (
                      <div
                        className={
                          header.column.getCanSort()
                            ? "cursor-pointer select-none flex items-center gap-2"
                            : ""
                        }
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {{
                          asc: <ChevronUp className="w-4 h-4" />,
                          desc: <ChevronDown className="w-4 h-4" />,
                        }[header.column.getIsSorted()] ?? null}
                      </div>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow 
                key={row.id}
                onClick={() => navigate(`/dashboard/orders/${row.original._id}`)}
                className="cursor-pointer hover:bg-muted/50"
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          Showing {table.getState().pagination.pageSize * table.getState().pagination.pageIndex + 1} to{" "}
          {Math.min(
            table.getState().pagination.pageSize * (table.getState().pagination.pageIndex + 1),
            table.getFilteredRowModel().rows.length
          )}{" "}
          of {table.getFilteredRowModel().rows.length} orders
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

export default OrderPage;