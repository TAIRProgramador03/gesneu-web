"use client"
import React, { useMemo, useState } from "react"
import { DataTablePagination } from "./data-table-pagination"
import { FilaComoTarjeta } from "./data-table-card"
import {
  ColumnDef,
  SortingState,
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
import { Upload as UploadIcon } from '@phosphor-icons/react/dist/ssr/Upload';
import { exportToExcel } from "@/utils/export-to-excel"
import { LoadingButton2 } from "../loading-button2"
import { Spinner } from "@/components/ui/spinner"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Columns3, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[],
  type?: string,
  filters?: boolean,
  isLoading?: boolean,
  exportConfig?: {
    title?: string,
    fileName?: string
    username?: string
  }
  withExport?: boolean
  /**
   * Si se entrega, por debajo de `md` la tabla se reemplaza por una lista de
   * tarjetas (una por fila). Sin esto la tabla se comporta como siempre.
   */
  renderCard?: (
    row: TData,
    ctx: { seleccionado: boolean; alternar: () => void }
  ) => React.ReactNode
  /**
   * En teléfono dibuja cada fila como tarjeta armada con las columnas visibles
   * (la primera es el título). Para un diseño propio usa `renderCard`.
   */
  tarjetasEnMovil?: boolean
  /** Columnas (accessorKey) ocultas al inicio. Por defecto CARGA y VELOCIDAD. */
  columnasOcultasPorDefecto?: string[]
  /** Muestra el selector "Columnas" en la barra superior. */
  selectorColumnas?: boolean
}

export function DataTableNeumaticos<TData, TValue>({
  columns,
  data,
  type = 'simple',
  filters = false,
  isLoading = false,
  exportConfig,
  withExport = false,
  renderCard,
  tarjetasEnMovil = false,
  columnasOcultasPorDefecto = ['CARGA', 'VELOCIDAD'],
  selectorColumnas = false,
}: DataTableProps<TData, TValue>) {

  const conTarjetas = Boolean(renderCard) || tarjetasEnMovil

  const [sorting, setSorting] = useState<SortingState>([])
  const [codigoSearchValue, setCodigoSearchValue] = useState<string>('')
  const [searchValue, setSearchValue] = useState<string>('')

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    () => Object.fromEntries(columnasOcultasPorDefecto.map((id) => [id, false]))
  )

  const [rowSelection, setRowSelection] = useState({})

  const filteredData = useMemo(() => {
    let result = data as Record<string, unknown>[]

    if (codigoSearchValue) {
      const lowerCodigo = codigoSearchValue.toLowerCase()
      result = result.filter((row) =>
        String(row.CODIGO ?? '').toLowerCase().includes(lowerCodigo)
      )
    }

    if (searchValue) {
      const lower = searchValue.toLowerCase()
      result = result.filter((row) =>
        Object.values(row).some((val) =>
          val !== null && val !== undefined && String(val).toLowerCase().includes(lower)
        )
      )
    }

    return result as TData[]
  }, [data, codigoSearchValue, searchValue])

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    autoResetPageIndex: true,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
    },
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
      fileName: exportConfig?.fileName,
      title: exportConfig?.title ?? 'Exportar',
    })
  }

  return (
    <div>

      {
        filters || withExport ? (
          <div className={cn('flex gap-2 py-4 md:flex-row md:items-center md:justify-between md:gap-6', conTarjetas ? 'items-center' : 'flex-col gap-3')}>
            {
              filters && (
                <div className="flex min-w-0 flex-1 gap-2">
                  <Input
                    placeholder={isLoading ? 'Cargando datos...' : 'Búsqueda por código'}
                    disabled={isLoading}
                    value={codigoSearchValue}
                    onChange={e => setCodigoSearchValue(e.target.value)}
                    className={conTarjetas ? 'hidden max-w-xs md:block' : 'max-w-xs'}
                  />
                  <div className="relative min-w-0 flex-1 md:max-w-sm">
                    {conTarjetas && (
                      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground md:hidden" />
                    )}
                    <Input
                      placeholder={isLoading ? 'Cargando datos...' : conTarjetas ? 'Buscar código, placa, marca…' : 'Búsqueda general'}
                      disabled={isLoading}
                      value={searchValue}
                      onChange={e => setSearchValue(e.target.value)}
                      className={conTarjetas ? 'w-full pl-9 md:pl-3' : 'max-w-sm'}
                    />
                  </div>
                </div>
              )
            }
            <div className="flex items-center gap-2 md:justify-end">
              {
                selectorColumnas && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className={conTarjetas ? 'hidden md:inline-flex' : ''}>
                        <Columns3 />
                        Columnas
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="max-h-80 w-56 overflow-auto">
                      <DropdownMenuLabel>Columnas visibles</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {table.getAllLeafColumns()
                        .filter(col => col.getCanHide() && 'accessorKey' in col.columnDef)
                        .map(col => {
                          const meta = col.columnDef.meta as { exportLabel?: string } | undefined
                          return (
                            <DropdownMenuCheckboxItem
                              key={col.id}
                              checked={col.getIsVisible()}
                              onCheckedChange={(v) => col.toggleVisibility(!!v)}
                              onSelect={(e) => e.preventDefault()}
                            >
                              {meta?.exportLabel ?? col.id}
                            </DropdownMenuCheckboxItem>
                          )
                        })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )
              }
              {
                withExport && (
                  <LoadingButton2
                    onClick={handleExportExcel}
                    icon={<UploadIcon />}
                    aria-label="Exportar a Excel"
                    className={conTarjetas ? 'max-md:size-10 max-md:px-0' : undefined}
                  >
                    <span className={conTarjetas ? 'hidden md:inline' : undefined}>Exportar</span>
                  </LoadingButton2>
                )
              }
            </div>
          </div>
        ) : null
      }

      {
        conTarjetas && (
          <div className="md:hidden">
            <div className="flex flex-col gap-3 pb-2">
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <React.Fragment key={row.id}>
                    {renderCard
                      ? renderCard(row.original, {
                        seleccionado: row.getIsSelected(),
                        alternar: () => row.toggleSelected(),
                      })
                      : <FilaComoTarjeta row={row} />}
                  </React.Fragment>
                ))
              ) : (
                <div className="flex h-24 items-center justify-center rounded-xl border text-sm">
                  {isLoading ? (
                    <div className="flex items-center gap-1">
                      <Spinner className="size-6" />
                      <span className="italic">Cargando</span>
                    </div>
                  ) : (
                    'Sin resultados.'
                  )}
                </div>
              )}
            </div>
          </div>
        )
      }

      <div className={conTarjetas ? "hidden overflow-hidden rounded-md border md:block" : "overflow-hidden rounded-md border"}>
        <Table containerClassName="relative w-full max-h-[480px] overflow-auto">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className="sticky top-0 z-10 font-bold text-center bg-sky-900 text-white"
                      style={{ '--accent': 'rgba(255,255,255,0.15)', '--accent-foreground': '#ffffff' } as React.CSSProperties}
                    >
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
                    <TableCell key={cell.id} className="text-center">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {isLoading ? (
                    <div className="flex gap-1 items-center justify-center">
                      <Spinner className="size-6" />
                      <span className="italic">Cargando</span>
                    </div>
                  ) : (
                    "Sin resultados."
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {
        conTarjetas && table.getSelectedRowModel().rows.length > 0 && (
          <div
            className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-2 border-t bg-card px-4 pt-3 shadow-[0_-4px_16px_rgba(0,0,0,0.12)] md:hidden"
            style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom, 0px))' }}
          >
            <span className="flex-1 text-sm font-bold">
              {table.getSelectedRowModel().rows.length} seleccionado(s)
            </span>
            <Button variant="outline" onClick={() => table.resetRowSelection()}>
              <X />
              Quitar
            </Button>
            <LoadingButton2 onClick={handleExportExcel} icon={<UploadIcon />}>
              Exportar
            </LoadingButton2>
          </div>
        )
      }

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
