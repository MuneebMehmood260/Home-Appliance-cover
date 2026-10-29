import React, { useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import {
  UploadCloud,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  FileText,
  RotateCcw,
  Save,
  Loader2,
} from 'lucide-react';
import { Product, BulkImportRow } from '../../types';
import { dbService } from '../../lib/supabase';
import { SEO } from '../../components/common/SEO';
import toast from 'react-hot-toast';

export const BulkImportPage: React.FC = () => {
  const [parsedRows, setParsedRows] = useState<BulkImportRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [importSummary, setImportSummary] = useState<{ success: number; failed: number } | null>(null);

  // Download Sample CSV
  const handleDownloadSampleCSV = () => {
    const sampleData = [
      {
        sku: 'SAMPLE-WMC-01',
        name: 'Quilted Top Load Cover Sample',
        category: 'washing-machine-covers',
        price: 2200,
        discount_price: 1850,
        stock_quantity: 30,
        low_stock_threshold: 5,
        description: 'Waterproof tailored sample cover with durable nylon zippers.',
        sizes: '6kg - 8kg, 9kg - 12kg',
        colors: 'Slate Grey, Midnight Navy',
        image_url: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=800&q=80',
        is_featured: 'true',
        is_active: 'true',
      },
      {
        sku: 'SAMPLE-RFC-02',
        name: 'Double Door Refrigerator Protector Mat',
        category: 'refrigerator-covers',
        price: 1500,
        discount_price: 1250,
        stock_quantity: 45,
        low_stock_threshold: 8,
        description: 'Protective quilted top cover with 6 storage side pockets.',
        sizes: 'Standard Double Door',
        colors: 'Geometric Grey, Floral Blue',
        image_url: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=800&q=80',
        is_featured: 'false',
        is_active: 'true',
      },
    ];

    const csv = Papa.unparse(sampleData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sample_appliance_covers_catalog.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Sample CSV template downloaded');
  };

  // Export current catalog to CSV
  const handleExportCSV = async () => {
    try {
      const products = await dbService.getProducts();
      const exportData = products.map((p) => ({
        sku: p.sku,
        name: p.name,
        category: p.category_slug || p.category?.slug || '',
        price: p.price,
        discount_price: p.discount_price ?? '',
        stock_quantity: p.stock_quantity,
        low_stock_threshold: p.low_stock_threshold,
        description: p.description,
        sizes: (p.sizes || []).join(', '),
        colors: (p.colors || []).join(', '),
        image_url: p.images?.[0]?.image_url || '',
        is_featured: p.is_featured ? 'true' : 'false',
        is_active: p.is_active ? 'true' : 'false',
      }));

      const csv = Papa.unparse(exportData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `catalog_export_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Exported ${products.length} products to CSV`);
    } catch {
      toast.error('Failed to export catalog');
    }
  };

  // Export current catalog to Excel (.xlsx)
  const handleExportExcel = async () => {
    try {
      const products = await dbService.getProducts();
      const exportData = products.map((p) => ({
        SKU: p.sku,
        Name: p.name,
        Category: p.category_slug || p.category?.slug || '',
        Price: p.price,
        DiscountPrice: p.discount_price ?? '',
        StockQuantity: p.stock_quantity,
        LowStockThreshold: p.low_stock_threshold,
        Description: p.description,
        Sizes: (p.sizes || []).join(', '),
        Colors: (p.colors || []).join(', '),
        ImageUrl: p.images?.[0]?.image_url || '',
        Featured: p.is_featured ? 'YES' : 'NO',
        Active: p.is_active ? 'YES' : 'NO',
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Products Catalog');
      XLSX.writeFile(workbook, `appliance_covers_catalog_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success(`Exported ${products.length} products to Excel`);
    } catch {
      toast.error('Failed to export Excel file');
    }
  };

  // Validate Raw Row
  const validateRow = (raw: Record<string, unknown>, rowNumber: number, seenSkus: Set<string>): BulkImportRow => {
    const errors: string[] = [];

    // Helper to find field ignoring case
    const getVal = (fieldVariants: string[]): string => {
      for (const f of fieldVariants) {
        if (raw[f] !== undefined && raw[f] !== null) {
          return String(raw[f]).trim();
        }
        // Case-insensitive lookup
        const lowerKey = f.toLowerCase();
        const foundKey = Object.keys(raw).find((k) => k.toLowerCase() === lowerKey);
        if (foundKey && raw[foundKey] !== undefined && raw[foundKey] !== null) {
          return String(raw[foundKey]).trim();
        }
      }
      return '';
    };

    const sku = getVal(['sku', 'product_sku', 'code', 'item_code']);
    const name = getVal(['name', 'product_name', 'title']);
    const category = getVal(['category', 'category_slug']);
    const priceStr = getVal(['price', 'regular_price', 'unit_price']);
    const discountStr = getVal(['discount_price', 'sale_price', 'discounted_price']);
    const stockStr = getVal(['stock_quantity', 'stock', 'qty', 'quantity']);
    const thresholdStr = getVal(['low_stock_threshold', 'threshold']);
    const description = getVal(['description', 'desc', 'details']) || 'Quality tailored appliance cover.';
    const sizes = getVal(['sizes', 'size']);
    const colors = getVal(['colors', 'color']);
    const image_url = getVal(['image_url', 'image', 'photo_url']);
    const featuredStr = getVal(['is_featured', 'featured']);
    const activeStr = getVal(['is_active', 'active']);

    if (!sku) {
      errors.push('Missing SKU');
    } else if (seenSkus.has(sku.toLowerCase())) {
      errors.push(`Duplicate SKU "${sku}" in this import file`);
    } else {
      seenSkus.add(sku.toLowerCase());
    }

    if (!name) {
      errors.push('Missing product name');
    }

    const price = parseFloat(priceStr);
    if (isNaN(price) || price < 0) {
      errors.push(`Invalid price: "${priceStr}"`);
    }

    let discount_price: number | undefined;
    if (discountStr) {
      discount_price = parseFloat(discountStr);
      if (isNaN(discount_price) || discount_price < 0) {
        errors.push(`Invalid discount price: "${discountStr}"`);
      } else if (discount_price > price) {
        errors.push(`Discount price (${discount_price}) cannot exceed regular price (${price})`);
      }
    }

    const stock_quantity = parseInt(stockStr, 10);
    if (isNaN(stock_quantity) || stock_quantity < 0) {
      errors.push(`Invalid stock quantity: "${stockStr}"`);
    }

    return {
      rowNumber,
      sku,
      name,
      category: category || 'washing-machine-covers',
      price: isNaN(price) ? 0 : price,
      discount_price,
      stock_quantity: isNaN(stock_quantity) ? 0 : stock_quantity,
      low_stock_threshold: parseInt(thresholdStr, 10) || 5,
      description,
      sizes,
      colors,
      image_url,
      is_featured: featuredStr.toLowerCase() === 'true' || featuredStr.toLowerCase() === 'yes',
      is_active: activeStr.toLowerCase() !== 'false' && activeStr.toLowerCase() !== 'no',
      errors,
      status: errors.length === 0 ? 'valid' : 'invalid',
    };
  };

  // Handle File Upload (CSV or Excel)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setImportSummary(null);

    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    if (isExcel) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const data = new Uint8Array(evt.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet);

          const seenSkus = new Set<string>();
          const validated = jsonData.map((row, index) => validateRow(row, index + 2, seenSkus));
          setParsedRows(validated);
          toast.success(`Parsed ${validated.length} rows from Excel`);
        } catch {
          toast.error('Failed to parse Excel file. Ensure valid format.');
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      // CSV
      Papa.parse<Record<string, unknown>>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const seenSkus = new Set<string>();
          const validated = results.data.map((row, index) => validateRow(row, index + 2, seenSkus));
          setParsedRows(validated);
          toast.success(`Parsed ${validated.length} rows from CSV`);
        },
        error: (err) => {
          toast.error(`CSV parse error: ${err.message}`);
        },
      });
    }

    e.target.value = '';
  };

  // Perform Upsert
  const handleExecuteImport = async () => {
    const validRows = parsedRows.filter((r) => r.status === 'valid');
    if (validRows.length === 0) {
      toast.error('No valid rows to import. Fix validation errors first.');
      return;
    }

    setIsProcessing(true);

    const payloadList: Partial<Product>[] = validRows.map((r) => ({
      sku: r.sku,
      name: r.name,
      slug: r.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + r.sku.toLowerCase(),
      category_slug: r.category,
      price: r.price,
      discount_price: r.discount_price ?? null,
      stock_quantity: r.stock_quantity,
      low_stock_threshold: r.low_stock_threshold || 5,
      description: r.description,
      sizes: r.sizes ? r.sizes.split(',').map((s) => s.trim()).filter(Boolean) : [],
      colors: r.colors ? r.colors.split(',').map((c) => c.trim()).filter(Boolean) : [],
      is_featured: r.is_featured ?? false,
      is_active: r.is_active ?? true,
      images: r.image_url
        ? [
            {
              id: `img-${Date.now()}-${r.sku}`,
              product_id: 'temp',
              image_url: r.image_url,
              alt_text: r.name,
              display_order: 1,
              is_primary: true,
            },
          ]
        : undefined,
    }));

    try {
      const summary = await dbService.bulkImportProducts(payloadList);
      setImportSummary(summary);
      toast.success(`Successfully imported/upserted ${summary.success} products!`);
    } catch {
      toast.error('Import process failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const validCount = parsedRows.filter((r) => r.status === 'valid').length;
  const invalidCount = parsedRows.filter((r) => r.status === 'invalid').length;

  return (
    <div className="space-y-8">
      <SEO title="Bulk Import / Export" description="Batch upload products via CSV or Excel with validation." />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
            Bulk Products Import & Export
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Upload CSV or Excel files with instant client-side validation, or export current stock.
          </p>
        </div>

        {/* Export action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleDownloadSampleCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-neutral-300 hover:bg-neutral-50 text-neutral-700 rounded-lg text-xs font-semibold transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Sample CSV</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-neutral-300 hover:bg-neutral-50 text-neutral-700 rounded-lg text-xs font-semibold transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Upload Drop Zone Card */}
      <div className="p-8 bg-white rounded-2xl border-2 border-dashed border-neutral-300 hover:border-neutral-900 transition-colors text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-full bg-neutral-100 flex items-center justify-center text-neutral-700">
          <UploadCloud className="w-6 h-6" />
        </div>

        <div className="space-y-1">
          <h3 className="text-sm font-bold text-neutral-900">
            Upload your CSV or Excel Spreadsheet (.xlsx, .csv)
          </h3>
          <p className="text-xs text-neutral-500 max-w-md mx-auto">
            Files are validated instantly in your browser before database insertion. Existing items with matching SKUs are updated automatically.
          </p>
        </div>

        <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-xs">
          <span>Choose File from Computer</span>
          <input
            type="file"
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>

        {fileName && (
          <p className="text-xs font-medium text-emerald-700">
            Loaded: <span className="font-mono">{fileName}</span>
          </p>
        )}
      </div>

      {/* Summary Box */}
      {importSummary && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-emerald-800 font-semibold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Batch Complete: {importSummary.success} products upserted successfully!</span>
          </div>
          <button
            onClick={() => setImportSummary(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Validation Preview Table */}
      {parsedRows.length > 0 && (
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-xs space-y-4">
          <div className="p-4 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-50">
            <div>
              <h2 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                Preview & Validation Results ({parsedRows.length} Rows)
              </h2>
              <div className="flex items-center gap-3 text-xs mt-0.5">
                <span className="text-emerald-700 font-semibold">{validCount} Valid</span>
                <span>·</span>
                <span className={`${invalidCount > 0 ? 'text-rose-600 font-bold' : 'text-neutral-500'}`}>
                  {invalidCount} With Errors
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setParsedRows([])}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-neutral-600 hover:text-neutral-900 rounded border border-neutral-300 bg-white"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>

              <button
                onClick={handleExecuteImport}
                disabled={validCount === 0 || isProcessing}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Importing...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Upsert {validCount} Products to Database</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left text-xs text-neutral-600">
              <thead className="bg-neutral-50 text-neutral-700 font-semibold uppercase text-[11px] border-b border-neutral-200 sticky top-0">
                <tr>
                  <th className="px-4 py-2.5">Row</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">SKU</th>
                  <th className="px-4 py-2.5">Product Name</th>
                  <th className="px-4 py-2.5">Category</th>
                  <th className="px-4 py-2.5">Price</th>
                  <th className="px-4 py-2.5">Stock</th>
                  <th className="px-4 py-2.5">Validation Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {parsedRows.map((row) => (
                  <tr
                    key={row.rowNumber}
                    className={`hover:bg-neutral-50/80 transition-colors ${
                      row.status === 'invalid' ? 'bg-rose-50/40' : ''
                    }`}
                  >
                    <td className="px-4 py-2.5 font-mono text-neutral-400 tabular-nums">
                      {row.rowNumber}
                    </td>

                    <td className="px-4 py-2.5 whitespace-nowrap">
                      {row.status === 'valid' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                          Ready
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 uppercase">
                          Error
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-2.5 font-mono font-bold text-neutral-900 whitespace-nowrap">
                      {row.sku || '—'}
                    </td>

                    <td className="px-4 py-2.5 font-medium text-neutral-900 max-w-xs truncate">
                      {row.name || '—'}
                    </td>

                    <td className="px-4 py-2.5 font-mono text-neutral-500 whitespace-nowrap">
                      {row.category}
                    </td>

                    <td className="px-4 py-2.5 tabular-nums font-semibold whitespace-nowrap">
                      Rs. {row.price}
                      {row.discount_price && (
                        <span className="text-[10px] text-neutral-400 block line-through">
                          Rs. {row.discount_price}
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-2.5 tabular-nums font-bold whitespace-nowrap">
                      {row.stock_quantity}
                    </td>

                    <td className="px-4 py-2.5">
                      {row.errors.length > 0 ? (
                        <div className="space-y-0.5">
                          {row.errors.map((err, i) => (
                            <span
                              key={i}
                              className="text-[11px] text-rose-700 font-medium flex items-center gap-1"
                            >
                              <AlertTriangle className="w-3 h-3 shrink-0" />
                              {err}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-emerald-700 flex items-center gap-1 text-[11px]">
                          <CheckCircle2 className="w-3 h-3" />
                          Validated
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
