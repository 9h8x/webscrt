"use client";
import { useState, useEffect } from "react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { Trash2, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";

// Define the Secret type based on your database schema
export type Secret = {
  id: number;
  created_at: string;
  content: string;
  school: number;
  titulo: string;
  approved: boolean;
  school_name?: string; // Optional field if you want to join with school name
};

interface SecretsDataTableProps {
  accessToken: string;
  refreshToken: string;
}

export function SecretsDataTable({
  accessToken,
  refreshToken,
}: SecretsDataTableProps) {
  const [data, setData] = useState<Secret[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [pendingApprovalUpdates, setPendingApprovalUpdates] = useState<
    Record<number, boolean>
  >({});
  const [pendingDeletions, setPendingDeletions] = useState<
    Record<number, boolean>
  >({});

  // Set the session when component mounts
  useEffect(() => {
    const setupAuth = async () => {
      try {
        // Set the session using the tokens passed from the server
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
      } catch (err) {
        console.error("Error setting up auth:", err);
      }
    };

    setupAuth();
  }, [accessToken, refreshToken]);

  // Fetch secrets from Supabase
  const fetchSecrets = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("secrets")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching secrets:", error);
        throw error;
      }

      setData(data || []);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching secrets:", err);
      setError(err.message || "Failed to load secrets");
    } finally {
      setLoading(false);
    }
  };

  // Update secret approval status
  const updateSecretApproval = async (id: number, approved: boolean) => {
    try {
      // No need to call getSession() here since we've already set the session
      const { error } = await supabase
        .from("secrets")
        .update({ approved })
        .eq("id", id);

      if (error) {
        console.error("Error updating secret approval:", error);
        throw error;
      }

      // Update local state
      setData((prev) =>
        prev.map((secret) =>
          secret.id === id ? { ...secret, approved } : secret
        )
      );

      // Show success message
      toast.success(
        `Secret ${approved ? "approved" : "unapproved"} successfully`
      );
    } catch (err: any) {
      console.error("Error updating secret approval:", err);
      toast.error(err.message || "Failed to update approval status");
    }
  };

  // Delete secret
  const deleteSecret = async (id: number) => {
    try {
      const { error } = await supabase.from("secrets").delete().eq("id", id);

      if (error) {
        console.error("Error deleting secret:", error);
        throw error;
      }

      // Update local state
      setData((prev) => prev.filter((s) => s.id !== id));

      // Show success message
      toast.success("Secret deleted successfully");
    } catch (err: any) {
      console.error("Error deleting secret:", err);
      toast.error(err.message || "Failed to delete secret");
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    // Only fetch data after auth is set up
    if (accessToken && refreshToken) {
      fetchSecrets();
    }
  }, [accessToken, refreshToken]);

  // Rest of your component remains the same...

  // Define columns for the data table
  const columns: ColumnDef<Secret>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("id")}</div>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Created At",
      cell: ({ row }) => {
        const date = new Date(row.getValue("created_at"));
        return <div>{format(date, "PPP p")}</div>;
      },
    },
    {
      accessorKey: "titulo",
      header: "Title",
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate font-medium">
          {row.getValue("titulo")}
        </div>
      ),
    },
    {
      accessorKey: "content",
      header: "Content",
      cell: ({ row }) => (
        <div className="max-w-[300px] truncate">{row.getValue("content")}</div>
      ),
    },
    {
      accessorKey: "school",
      header: "School ID",
      cell: ({ row }) => <div>{row.getValue("school")}</div>,
    },
    {
      accessorKey: "approved",
      header: "Approved",
      cell: ({ row }) => {
        const id = row.original.id;
        const isApproved = row.getValue("approved") as boolean;
        const isPending = pendingApprovalUpdates[id] !== undefined;

        return (
          <div className="flex items-center space-x-2">
            <Switch
              checked={
                pendingApprovalUpdates[id] !== undefined
                  ? pendingApprovalUpdates[id]
                  : isApproved
              }
              onCheckedChange={async (checked) => {
                try {
                  // Set pending state
                  setPendingApprovalUpdates((prev) => ({
                    ...prev,
                    [id]: checked,
                  }));

                  // Update in the database
                  await updateSecretApproval(id, checked);
                } catch (error: any) {
                  toast.error(
                    error.message || "Failed to update approval status"
                  );
                } finally {
                  // Clear pending state
                  setPendingApprovalUpdates((prev) => {
                    const newState = { ...prev };
                    delete newState[id];
                    return newState;
                  });
                }
              }}
              disabled={isPending}
            />
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : isApproved ? (
              <Badge
                variant="outline"
                className="bg-green-50 text-green-700 border-green-200"
              >
                Approved
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="bg-red-50 text-red-700 border-red-200"
              >
                Not Approved
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const secret = row.original;
        const isPendingDeletion = pendingDeletions[secret.id] === true;

        return (
          <div className="flex items-center justify-end">
            <AlertDialog>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={isPendingDeletion}
                      >
                        {isPendingDeletion ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-destructive" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Delete secret</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    the secret with title "{secret.titulo}" and remove it from
                    our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive hover:bg-destructive/90"
                    onClick={async (e) => {
                      e.preventDefault();
                      try {
                        // Set pending state
                        setPendingDeletions((prev) => ({
                          ...prev,
                          [secret.id]: true,
                        }));

                        // Delete from database
                        await deleteSecret(secret.id);
                      } catch (error: any) {
                        toast.error(error.message || "Failed to delete secret");
                      } finally {
                        // Clear pending state
                        setPendingDeletions((prev) => {
                          const newState = { ...prev };
                          delete newState[secret.id];
                          return newState;
                        });
                      }
                    }}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  // Loading state
  if (loading) {
    return <SecretsTableSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <X className="h-10 w-10 text-destructive mb-4" />
        <h3 className="text-lg font-semibold">Failed to load secrets</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={() => fetchSecrets()} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter by title..."
          value={(table.getColumn("titulo")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("titulo")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuItem
                    key={column.id}
                    className="capitalize"
                    onSelect={(e) => e.preventDefault()}
                  >
                    <div
                      className="flex items-center space-x-2"
                      onClick={() =>
                        column.toggleVisibility(!column.getIsVisible())
                      }
                    >
                      <Switch checked={column.getIsVisible()} />
                      <span>{column.id}</span>
                    </div>
                  </DropdownMenuItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No secrets found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} secret(s) total.
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

// Skeleton loader for the table
function SecretsTableSkeleton() {
  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Skeleton className="h-10 w-[250px]" />
        <Skeleton className="ml-auto h-10 w-[100px]" />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {Array.from({ length: 7 }).map((_, index) => (
                <TableHead key={index}>
                  <Skeleton className="h-6 w-full" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, rowIndex) => (
              <TableRow key={rowIndex}>
                {Array.from({ length: 7 }).map((_, cellIndex) => (
                  <TableCell key={cellIndex}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Skeleton className="h-5 w-[150px]" />
        <div className="space-x-2">
          <Skeleton className="h-9 w-[80px] inline-block" />
          <Skeleton className="h-9 w-[80px] inline-block" />
        </div>
      </div>
    </div>
  );
}
