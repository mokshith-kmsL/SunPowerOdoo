import { useState, useEffect } from 'react';
import api from '../api.js';

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editQty, setEditQty] = useState('');

  function loadInventory() {
    setLoading(true);
    api.get('/inventory')
      .then((res) => setItems(res.data.data))
      .catch(() => setError('Could not load inventory.'))
      .finally(() => setLoading(false));
    api.get('/inventory/low-stock')
      .then((res) => setLowStock(res.data.data))
      .catch(() => {});
  }

  useEffect(() => { loadInventory(); }, []);

  async function handleUpdate(productId) {
    try {
      await api.put(`/inventory/${productId}`, { quantity_available: editQty });
      setEditingId(null);
      setEditQty('');
      loadInventory();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update inventory.');
    }
  }

  async function handleAddStock(productId) {
    const qty = prompt('Enter quantity to add:');
    if (!qty || parseInt(qty) <= 0) return;
    try {
      await api.post(`/inventory/${productId}/add-stock`, { quantity: parseInt(qty) });
      loadInventory();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add stock.');
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Inventory</h2>
          <p>Stock levels for all products</p>
        </div>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {lowStock.length > 0 && (
        <div className="alert-error" style={{ marginBottom: 16 }}>
          <strong>Low Stock Alert:</strong> {lowStock.length} item(s) at or below minimum stock — {lowStock.map((l) => l.product_name).join(', ')}
        </div>
      )}

      {loading ? (
        <p className="loading"><span className="spinner"></span>Loading…</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Available</th>
                <th>Reserved</th>
                <th>Min Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={7} className="empty">No inventory records.</td></tr>
              ) : items.map((i) => (
                <tr key={i.id}>
                  <td><strong>{i.product_name}</strong></td>
                  <td>{i.sku}</td>
                  <td>{i.category?.replace(/_/g, ' ')}</td>
                  <td>
                    {editingId === i.id ? (
                      <input type="number" value={editQty} onChange={(e) => setEditQty(e.target.value)} style={{ width: 70 }} />
                    ) : (
                      <span style={{ color: i.quantity_available <= i.minimum_stock ? '#dc2626' : '#18181b', fontWeight: i.quantity_available <= i.minimum_stock ? 600 : 400 }}>
                        {i.quantity_available}
                      </span>
                    )}
                  </td>
                  <td>{i.quantity_reserved}</td>
                  <td>{i.minimum_stock}</td>
                  <td>
                    {editingId === i.id ? (
                      <>
                        <button className="btn-primary btn-sm" style={{ marginTop: 0 }} onClick={() => handleUpdate(i.product_id)}>Save</button>
                        <button className="btn-ghost btn-sm" style={{ marginLeft: 4 }} onClick={() => setEditingId(null)}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <button className="btn-ghost btn-sm" onClick={() => { setEditingId(i.id); setEditQty(i.quantity_available); }}>Edit</button>
                        <button className="btn-ghost btn-sm" style={{ marginLeft: 4 }} onClick={() => handleAddStock(i.product_id)}>+ Stock</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
