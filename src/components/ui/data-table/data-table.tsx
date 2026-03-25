"use client"
import React, { useState } from "react"
import { DataTablePagination } from "./data-table-pagination"
import {
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import ButtonMateria from '@mui/material/Button';
import { Upload as UploadIcon } from '@phosphor-icons/react/dist/ssr/Upload';
import { exportToExcel } from "@/utils/export-to-excel"
import { LoadingButton2 } from "../loading-button2"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[],
  type?: string,
  filters?: boolean,
  exportConfig?: {
    title?: string
    username?: string
  }
  withExport?: boolean
}

export function DataTableNeumaticos<TData, TValue>({
  columns,
  data,
  type = 'simple',
  filters = false,
  exportConfig,
  withExport = false
}: DataTableProps<TData, TValue>) {

  const [sorting, setSorting] = useState<SortingState>([])

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const [globalFilter, setGlobalFilter] = useState<string>('')

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    CARGA: false,
    VELOCIDAD: false,
    RQ: false,
    COSTO: false
  })

  const [rowSelection, setRowSelection] = useState({})

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    globalFilterFn: 'includesString',
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter
    },
    onGlobalFilterChange: setGlobalFilter
  })

  const handleExportExcel = () => {
    const sortedRows = table.getSortedRowModel().rows
    const filteredRows = table.getSelectedRowModel().rows.length > 0
      ? sortedRows.filter(row => row.getIsSelected())
      : sortedRows
    if (filteredRows.length === 0) return

    const exportData = filteredRows.map(row => {
      const rowData: Record<string, unknown> = {}
      table.getAllLeafColumns()
        .filter(col => 'accessorKey' in col.columnDef)
        .forEach(column => {
          const meta = column.columnDef.meta as { exportLabel?: string; exportValue?: (v: unknown) => unknown } | undefined
          const header = column.columnDef.header
          const label = meta?.exportLabel ?? (typeof header === 'string' ? header : column.id)
          const value = row.getValue(column.id)
          rowData[label] = meta?.exportValue ? meta.exportValue(value) : value
        })
      return rowData
    })

    exportToExcel({
      data: exportData as any,
      username: exportConfig?.username ?? '',
      title: exportConfig?.title ?? 'Exportar',
    })
  }

  return (
    <div>

      {
        filters || withExport ? (
          <div className="flex items-center py-4 justify-between">
            {
              filters && (
                <Input
                  placeholder="Buscar..."
                  value={globalFilter ?? ''}
                  onChange={e => setGlobalFilter(String(e.target.value))}
                  className="max-w-sm"
                />
              )
            }
            {
              withExport && (
                <div className="">
                  <LoadingButton2
                    onClick={handleExportExcel}
                    icon={<UploadIcon />}
                  >
                    Exportar
                  </LoadingButton2>
                </div>
              )
            }
          </div>
        ) : null
      }

      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="font-bold">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    </TableHead>
                  )
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
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Sin resultados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {
        type === 'pagination' && (
          <div className="py-4">
            <DataTablePagination table={table} />
          </div>
        )
      }
    </div>
  )
}