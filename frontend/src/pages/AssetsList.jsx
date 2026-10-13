import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  Plus,
  Filter,
  QrCode,
  Download,
  Copy,
  ExternalLink,
  Printer,
  Check,
  X,
  Box,
  MapPin,
  Calendar,
  AlertCircle,
  Clock,
  Layers,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function AssetsList() {
  const { isAdmin } = useAuth();
  const [searchParams] = useSearchParams();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedAssetForQR, setSelectedAssetForQR] = useState(null);
  const [isBulkPrintOpen, setIsBulkPrintOpen] = useState(false);

  // Create Asset Form State
  const [formData, setFormData] = useState({
    name: '',
    assetCode: '',
    category: 'Electronics',
    building: 'Main Campus',
    floor: '1st Floor',
    room: 'Room 101',
    condition: 'Good',
    modelNumber: '',
    serialNumber: '',
    notes: '',
  });

  const fetchAssets = async () => {
    try {
      const res = await API.get('/assets', {
        params: {
          search,
          category: categoryFilter,
          status: statusFilter,
        },
      });
      if (res.data.success) {
        setAssets(res.data.assets);
      }
    } catch {
      toast.error('Failed to load assets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [categoryFilter, statusFilter]);

  useEffect(() => {
    if (searchParams.get('action') === 'create') {
      setIsCreateModalOpen(true);
    }
  }, [searchParams]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAssets();
  };

  const handleCreateAsset = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.assetCode) {
      toast.error('Asset Name and Unique Code are required');
      return;
    }

    try {
      const payload = {
        name: formData.name,
        assetCode: formData.assetCode.toUpperCase().trim(),
        category: formData.category,
        location: {
          building: formData.building,
          floor: formData.floor,
          room: formData.room,
        },
        condition: formData.condition,
        modelNumber: formData.modelNumber,
        serialNumber: formData.serialNumber,
        notes: formData.notes,
      };

      const res = await API.post('/assets', payload);
      if (res.data.success) {
        toast.success(`Asset ${res.data.asset.assetCode} created successfully`);
        setIsCreateModalOpen(false);
        setFormData({
          name: '',
          assetCode: '',
          category: 'Electronics',
          building: 'Main Campus',
          floor: '1st Floor',
          room: 'Room 101',
          condition: 'Good',
          modelNumber: '',
          serialNumber: '',
          notes: '',
        });
        fetchAssets();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating asset');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Public URL copied to clipboard');
  };

  const downloadQRAsSVG = (code) => {
    const svg = document.getElementById(`qr-svg-${code}`);
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const URL = window.URL || window.webkitURL || window;
    const blobURL = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobURL;
    link.download = `FixFlow_QR_${code}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`QR code downloaded for ${code}`);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Operational':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Issue Reported':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Under Inspection':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Under Maintenance':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Out of Service':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'Retired':
        return 'bg-slate-100 text-slate-600 border-slate-300';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Asset Inventory & QR Labels
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage physical assets, generate scannable tags, and audit operational status
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsBulkPrintOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold shadow-sm transition"
          >
            <Printer className="h-4 w-4" />
            <span>Bulk Label Sheet</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow transition"
            >
              <Plus className="h-4 w-4" />
              <span>Register Asset</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="h-4 w-4 absolute left-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by asset name, unique code, or model..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </form>

        <div className="flex items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            <option value="Electronics">Electronics</option>
            <option value="HVAC">HVAC</option>
            <option value="Machinery">Machinery</option>
            <option value="Audio/Visual">Audio/Visual</option>
            <option value="Computing">Computing</option>
            <option value="Furniture">Furniture</option>
            <option value="Plumbing">Plumbing</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="Operational">Operational</option>
            <option value="Issue Reported">Issue Reported</option>
            <option value="Under Inspection">Under Inspection</option>
            <option value="Under Maintenance">Under Maintenance</option>
            <option value="Out of Service">Out of Service</option>
            <option value="Retired">Retired</option>
          </select>

          {(search || categoryFilter || statusFilter) && (
            <button
              onClick={() => {
                setSearch('');
                setCategoryFilter('');
                setStatusFilter('');
                fetchAssets();
              }}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              title="Reset Filters"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Asset Grid / Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : assets.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-slate-200 shadow-sm space-y-3">
          <Box className="h-10 w-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">No assets match your criteria</h3>
          <p className="text-sm text-slate-400">Try adjusting your filters or search terms.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {assets.map((asset) => {
            const publicUrl = `${window.location.origin}/scan/${asset.assetCode}`;
            return (
              <div
                key={asset._id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition p-5 flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: Code and Status */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                      {asset.assetCode}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${getStatusBadge(
                        asset.status
                      )}`}
                    >
                      {asset.status}
                    </span>
                  </div>

                  {/* Asset Name & Category */}
                  <h3 className="text-lg font-bold text-slate-900 mt-3 truncate" title={asset.name}>
                    {asset.name}
                  </h3>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">
                    {asset.category} {asset.modelNumber ? `• ${asset.modelNumber}` : ''}
                  </div>

                  {/* Location & Metadata */}
                  <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">
                        {asset.location?.building}, {asset.location?.room}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>
                        Next Service:{' '}
                        {asset.nextServiceDate
                          ? new Date(asset.nextServiceDate).toLocaleDateString()
                          : 'Not scheduled'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setSelectedAssetForQR(asset)}
                      className="p-2 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition"
                      title="View & Print QR Label"
                    >
                      <QrCode className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => copyToClipboard(publicUrl)}
                      className="p-2 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition"
                      title="Copy Public Asset Link"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <Link
                      to={`/scan/${asset.assetCode}`}
                      target="_blank"
                      className="p-2 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition"
                      title="Open Public Scan View"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </div>

                  <Link
                    to={`/assets/${asset._id}`}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* QR Code Label Modal */}
      {selectedAssetForQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative space-y-5">
            <button
              onClick={() => setSelectedAssetForQR(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>

            <div>
              <h3 className="text-lg font-bold text-slate-900">Physical Asset Tag</h3>
              <p className="text-xs text-slate-500">
                Official scan label compliant with Hackathon MaintainIQ standards
              </p>
            </div>

            {/* Printable Asset Tag Preview */}
            <div
              id="printable-tag"
              className="border-2 border-slate-900 rounded-xl p-5 bg-white text-slate-900 shadow-inner flex flex-col items-center text-center space-y-3"
            >
              <div className="w-full border-b border-slate-200 pb-2 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-600">
                <span>FixFlow Asset Tag</span>
                <span className="font-mono text-blue-700">{selectedAssetForQR.assetCode}</span>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm">
                <QRCodeSVG
                  id={`qr-svg-${selectedAssetForQR.assetCode}`}
                  value={`${window.location.origin}/scan/${selectedAssetForQR.assetCode}`}
                  size={160}
                  level="H"
                  includeMargin={true}
                />
              </div>

              <div>
                <h4 className="font-bold text-base text-slate-900 leading-snug">
                  {selectedAssetForQR.name}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Location: {selectedAssetForQR.location?.building} • {selectedAssetForQR.location?.room}
                </p>
              </div>

              <div className="w-full bg-slate-100 rounded-lg py-1.5 px-2 text-[11px] font-semibold text-slate-600">
                Scan with phone camera to report issue or verify service history
              </div>
            </div>

            {/* Tag Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => downloadQRAsSVG(selectedAssetForQR.assetCode)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition"
              >
                <Download className="h-4 w-4" />
                <span>Download SVG</span>
              </button>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow"
              >
                <Printer className="h-4 w-4" />
                <span>Print Asset Tag</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk QR Label Sheet Modal */}
      {isBulkPrintOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Bulk Asset Label Sheet</h3>
                <p className="text-xs text-slate-500">
                  Ready-to-print batch of {assets.length} scannable physical tags
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print All Labels</span>
                </button>
                <button
                  onClick={() => setIsBulkPrintOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 printable-label">
              {assets.map((a) => (
                <div
                  key={a._id}
                  className="border-2 border-slate-800 rounded-xl p-3.5 bg-white text-slate-900 flex flex-col items-center text-center space-y-2"
                >
                  <div className="w-full flex justify-between items-center text-[10px] font-bold uppercase text-slate-500 border-b pb-1">
                    <span>FixFlow</span>
                    <span className="font-mono text-blue-700">{a.assetCode}</span>
                  </div>
                  <QRCodeSVG
                    value={`${window.location.origin}/scan/${a.assetCode}`}
                    size={110}
                    level="M"
                    includeMargin={false}
                  />
                  <div className="w-full text-center">
                    <div className="font-bold text-xs truncate">{a.name}</div>
                    <div className="text-[10px] text-slate-500 truncate">
                      {a.location?.building} • {a.location?.room}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Register Asset Modal (Admin Only) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-5">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>

            <div>
              <h3 className="text-lg font-bold text-slate-900">Register New Asset</h3>
              <p className="text-xs text-slate-500">
                Generates a digital identity and permanent QR code link
              </p>
            </div>

            <form onSubmit={handleCreateAsset} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Asset Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Science Lab Projector 02"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Unique Asset Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AST-1006"
                    value={formData.assetCode}
                    onChange={(e) => setFormData({ ...formData, assetCode: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Electronics">Electronics</option>
                    <option value="HVAC">HVAC</option>
                    <option value="Machinery">Machinery</option>
                    <option value="Audio/Visual">Audio/Visual</option>
                    <option value="Computing">Computing</option>
                    <option value="Furniture">Furniture</option>
                    <option value="Plumbing">Plumbing</option>
                    <option value="Vehicles">Vehicles</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Initial Condition
                  </label>
                  <select
                    value={formData.condition}
                    onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Building
                  </label>
                  <input
                    type="text"
                    value={formData.building}
                    onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Floor
                  </label>
                  <input
                    type="text"
                    value={formData.floor}
                    onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Room
                  </label>
                  <input
                    type="text"
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Model Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. MX-2004"
                    value={formData.modelNumber}
                    onChange={(e) => setFormData({ ...formData, modelNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Serial Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SN-99810-Z"
                    value={formData.serialNumber}
                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow transition"
                >
                  Register & Generate QR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
