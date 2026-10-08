import React, { useState, useEffect } from 'react';

// Helper: Sanitize string inputs to prevent XSS
const escapeHtml = (str) => {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

// Helper: Get CSRF token from meta tag (Laravel sets this in app.blade.php)
const getCsrfToken = () => {
  const meta = document.querySelector('meta[name="csrf-token"]');
  return meta ? meta.getAttribute('content') : '';
};

// Helper: Common headers for JSON + CSRF
const apiHeaders = () => ({
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'X-CSRF-TOKEN': getCsrfToken(),
});

const Welcome = ({ initialItems = [] }) => {
  const [items, setItems] = useState(initialItems);
  const [loading, setLoading] = useState(initialItems.length === 0);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Electronics',
    location: '',
    contact: '',
  });

  // --- 1. READ: Fetch all items from Laravel API ---
  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/items', {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to fetch items');
      const data = await response.json();
      // Laravel returns either an array or { data: [...] } — handle both
      setItems(Array.isArray(data) ? data : data.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching items:', err);
      setError('Could not load registry records.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch if the server didn't preload items
    if (initialItems.length === 0) {
      fetchItems();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-initialize Lucide icons after items render
  useEffect(() => {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }, [items]);

  // Handle form input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  // --- 2. CREATE: POST to Laravel, then refresh list ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/items', {
        method: 'POST',
        headers: apiHeaders(),
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to add item');
      }

      // Clear form
      setFormData({
        name: '',
        category: 'Electronics',
        location: '',
        contact: '',
      });

      // Refresh table from server
      await fetchItems();

      // Scroll to records
      document.getElementById('records')?.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      console.error('Error adding item:', error);
      alert(error.message);
    }
  };

  // --- 3. UPDATE: PUT to Laravel ---
  const toggleStatus = async (id) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    const newStatus = item.status === 'Claimed' ? 'Unclaimed' : 'Claimed';

    try {
      const response = await fetch(`/api/items/${id}`, {
        method: 'PUT',
        headers: apiHeaders(),
        body: JSON.stringify({
          name: item.name,
          category: item.category,
          location: item.location,
          contact: item.contact,
          status: newStatus,
        }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      // Optimistic update locally, then refresh
      setItems(items.map((i) =>
        i.id === id ? { ...i, status: newStatus } : i
      ));
      await fetchItems();
    } catch (error) {
      console.error('Error updating status:', error);
      alert(error.message);
    }
  };

  // --- 4. DELETE: DELETE to Laravel ---
  const deleteItem = async (id) => {
    if (!window.confirm('Are you sure you want to remove this entry from the registry?')) {
      return;
    }

    try {
      const response = await fetch(`/api/items/${id}`, {
        method: 'DELETE',
        headers: apiHeaders(),
      });

      if (!response.ok) throw new Error('Failed to delete item');

      setItems(items.filter((item) => item.id !== id));
    } catch (error) {
      console.error('Error deleting item:', error);
      alert(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans antialiased">
      {/* 1. NAVBAR */}
      <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow">
              LF
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-white leading-tight">Campus Lost & Found</h1>
              <p className="text-xs text-slate-400 hidden sm:block">BSIT Official Central Registry</p>
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* 2. HERO */}
        <section className="min-h-[75vh] flex items-center justify-center bg-gradient-to-b from-slate-950 to-slate-900 border-b border-slate-800 px-4 py-16 text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            <span className="inline-block px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold tracking-wider uppercase">
              Campus Open Registry System
            </span>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Lost Something on Campus?<br />
              <span className="text-indigo-400">We've Got You Covered.</span>
            </h2>
            <p className="text-slate-300 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
              Index lost equipment, personal belongings, or official documents found across academic laboratories, libraries, and grounds.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <a
                href="#report"
                className="w-full sm:w-auto px-6 py-3 rounded-xl hover:bg-green-400 bg-indigo-600 hover:text-black animate-scale hover:shadow-green-800 hover:shadow-lg text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/30"
              >
                Report Lost Item
              </a>
            </div>
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 space-y-16">
          {/* 3. REPORT FORM */}
          <section id="report" className="scroll-mt-20 max-w-2xl mx-auto">
            <div className="bg-slate-800/90 rounded-2xl border border-slate-700 p-6 sm:p-8 shadow-xl">
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-700">
                <div>
                  <h3 className="text-xl font-bold text-white">Report Found Item</h3>
                  <p className="text-xs text-slate-400">File a new record into the central campus database</p>
                </div>
                <span className="text-xs font-mono text-indigo-400 bg-indigo-950 border border-indigo-800 px-2.5 py-1 rounded-md hidden sm:inline-block">
                  POST /api/items
                </span>
              </div>

              <form id="lost-item-form" className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Item Description *
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    placeholder="e.g. Acer Type-C Charger, Student ID, Water Bottle"
                    className="w-full px-4 py-2.5 bg-slate-900 text-slate-100 text-sm border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-500"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Category *
                    </label>
                    <select
                      id="category"
                      className="w-full px-4 py-2.5 bg-slate-900 text-slate-100 text-sm border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      value={formData.category}
                      onChange={handleChange}
                    >
                      <option value="Electronics">Electronics</option>
                      <option value="Personal Items">Personal Items</option>
                      <option value="Documents">Documents</option>
                      <option value="Others">Others</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Location Found *
                    </label>
                    <input
                      id="location"
                      type="text"
                      required
                      placeholder="e.g. Computer Lab 2, Library"
                      className="w-full px-4 py-2.5 bg-slate-900 text-slate-100 text-sm border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-500"
                      value={formData.location}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Contact Information *
                  </label>
                  <input
                    id="contact"
                    type="text"
                    required
                    placeholder="Full Name & email / phone number"
                    className="w-full px-4 py-2.5 bg-slate-900 text-slate-100 text-sm border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-500"
                    value={formData.contact}
                    onChange={handleChange}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 py-3 px-6 bg-indigo-600 hover:bg-green-400 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-indigo-600/20"
                >
                  Submit Registry Entry
                </button>
              </form>
            </div>
          </section>

          {/* 4. RECORDS TABLE */}
          <section id="records" className="scroll-mt-20">
            <div className="bg-slate-800/90 rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
              <div className="p-5 border-b border-slate-700 flex items-center justify-between flex-wrap gap-4 bg-slate-800/50">
                <div>
                  <h3 className="text-lg font-bold text-white">Registry Records</h3>
                  <p className="text-xs text-slate-400">Real-time database status updates & interactive status toggles</p>
                </div>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-950 border border-emerald-800 px-2.5 py-1 rounded-md">
                  GET /api/items
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-900/60 border-b border-slate-700 text-slate-400 text-xs font-bold uppercase tracking-wider">
                      <th className="py-3.5 px-5">Item Details</th>
                      <th className="py-3.5 px-5">Location</th>
                      <th className="py-3.5 px-5">Contact</th>
                      <th className="py-3.5 px-5">Status</th>
                      <th className="py-3.5 px-5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/60">
                    {loading ? (
                      <tr>
                        <td colSpan="5" className="py-8 text-center text-slate-500 text-sm">
                          Loading registry records...
                        </td>
                      </tr>
                    ) : error ? (
                      <tr>
                        <td colSpan="5" className="py-8 text-center text-red-400 text-sm">
                          {error}
                        </td>
                      </tr>
                    ) : items.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-8 text-center text-slate-500 text-sm">
                          No registry entries found. Submit a new item above.
                        </td>
                      </tr>
                    ) : (
                      items.map((item) => {
                        const isClaimed = item.status === 'Claimed';
                        const statusBadgeClass = isClaimed
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30';

                        return (
                          <tr key={item.id} className="hover:bg-slate-800/50 transition-colors">
                            <td className="py-4 px-5">
                              <div className="font-semibold text-white">{escapeHtml(item.name)}</div>
                              <div className="text-xs text-indigo-400 mt-0.5">{escapeHtml(item.category)}</div>
                            </td>
                            <td className="py-4 px-5 text-slate-300">
                              {escapeHtml(item.location)}
                            </td>
                            <td className="py-4 px-5 text-slate-300">
                              {escapeHtml(item.contact)}
                            </td>
                            <td className="py-4 px-5">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusBadgeClass}`}>
                                {item.status}
                              </span>
                            </td>
                            <td className="py-4 px-5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => toggleStatus(item.id)}
                                  title="Toggle Claim Status"
                                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                    isClaimed
                                      ? 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                                  }`}
                                >
                                  {isClaimed ? 'Mark Unclaimed' : 'Mark Claimed'}
                                </button>
                                <button
                                  onClick={() => deleteItem(item.id)}
                                  title="Delete Entry"
                                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* 5. FOOTER */}
      <footer className="border-t border-slate-800 bg-slate-950 py-8 text-xs text-slate-400">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-bold text-slate-200">Campus IT Helpdesk & Lost Registry</p>
            <p>Building 3, Main Campus • support@campus.edu.ph</p>
          </div>
          <div className="text-center sm:text-right">
            <p>Built for BSIT Practical Assessment</p>
            <p className="text-slate-500">© 2026 BSIT Development Team</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Welcome;