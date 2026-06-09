import { useState, useMemo } from 'react';
import { updateProductCategory } from '../../firebase/reports';
import Card from '../UI/Card';
import DetailModal from '../UI/DetailModal';
import { formatNumber } from '../../utils/formatters';

const SUGGESTED_CATEGORIES = [
  'Abaya', 'Kurti', 'Gown', 'Kaftan', 'Cover Up',
  'Hijab', 'Set / Combo', 'Panjabi', 'Tops', 'Bottoms',
  'Cardigan', 'Other',
];

const CATEGORY_COLORS = {
  Abaya: '#C9A84C',
  Kurti: '#0D9488',
  Gown: '#E11D48',
  Kaftan: '#F59E0B',
  'Cover Up': '#8B5CF6',
  Hijab: '#EC4899',
  'Set / Combo': '#14B8A6',
  Panjabi: '#6366F1',
  Tops: '#06B6D4',
  Bottoms: '#F97316',
  Cardigan: '#84CC16',
  Other: '#64748B',
};

export default function OthersCategoryPanel({ products, loading, onCategoryUpdated }) {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [successToast, setSuccessToast] = useState(null);

  const otherProducts = useMemo(() => {
    return (products || []).filter(p => {
      const cat = (p.category || '').toLowerCase();
      return cat === 'other' || cat === '' || cat === null || cat === undefined;
    }).sort((a, b) => (b.totalQuantitySold || 0) - (a.totalQuantitySold || 0));
  }, [products]);

  if (loading) return null;

  if (otherProducts.length === 0) return null;

  const handleSelectCategory = async (category) => {
    if (!selectedProduct) return;
    setUpdating(true);
    try {
      await updateProductCategory(selectedProduct.name, category);
      setSuccessToast(`"${selectedProduct.name}" → ${category}`);
      setSelectedProduct(null);
      if (onCategoryUpdated) onCategoryUpdated();
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (err) {
      console.error('Failed to update category:', err);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="animate-fade-in-up stagger-6">
      <Card className="relative overflow-hidden">
        {/* Decorative gradient strip */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 rounded-t-2xl" />

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="section-title">Uncategorized Products</h3>
              <p className="text-xs text-text-muted mt-0.5">{otherProducts.length} products need categorization</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-gradient-to-r from-amber-400/10 to-orange-400/10 text-amber-600 rounded-full text-xs font-semibold border border-amber-400/20">
            {otherProducts.length} pending
          </span>
        </div>

        <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
          {otherProducts.map((product, i) => (
            <button
              key={product.name}
              onClick={() => setSelectedProduct(product)}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-amber-50/50 to-orange-50/30 border border-amber-200/30 hover:border-amber-300/50 hover:from-amber-50 hover:to-orange-50 transition-all duration-200 group text-left"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0 group-hover:scale-125 transition-transform" />
                <span className="text-sm font-medium text-text-primary truncate">{product.name}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs font-mono text-text-muted">{formatNumber(product.totalQuantitySold || 0)} sold</span>
                <svg className="w-4 h-4 text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* Category Selection Modal */}
      <DetailModal
        open={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        title="Assign Category"
        subtitle={selectedProduct?.name}
        icon={
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 7h.01M7 3h5a1.99 1.99 0 011.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" />
          </svg>
        }
        color="#F59E0B"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-muted">
            Select the correct category for <span className="font-semibold text-text-primary">{selectedProduct?.name}</span>
          </p>

          {selectedProduct && (
            <div className="p-3 bg-bg-elevated/50 rounded-xl border border-border/30">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted">Current: <span className="font-medium text-text-primary">{selectedProduct.category || 'Other'}</span></span>
                <span className="text-text-muted">Sold: <span className="font-medium text-accent-gold font-mono">{formatNumber(selectedProduct.totalQuantitySold || 0)}</span></span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {SUGGESTED_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => handleSelectCategory(cat)}
                disabled={updating}
                className="relative px-3 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 hover:scale-[1.03] hover:shadow-lg active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed group"
                style={{
                  borderColor: `${CATEGORY_COLORS[cat]}30`,
                  background: `linear-gradient(135deg, ${CATEGORY_COLORS[cat]}08, ${CATEGORY_COLORS[cat]}15)`,
                  color: CATEGORY_COLORS[cat],
                }}
              >
                <span className="relative z-10">{cat}</span>
                <div
                  className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  style={{ background: `linear-gradient(135deg, ${CATEGORY_COLORS[cat]}15, ${CATEGORY_COLORS[cat]}25)` }}
                />
              </button>
            ))}
          </div>

          {updating && (
            <div className="flex items-center justify-center gap-2 py-3 text-sm text-amber-600">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Updating category...
            </div>
          )}
        </div>
      </DetailModal>

      {/* Success Toast */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-[200] animate-slide-up">
          <div className="flex items-center gap-3 px-4 py-3 bg-white/95 backdrop-blur-xl border border-teal-200/50 rounded-2xl shadow-xl shadow-teal-500/10">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">Category Updated</p>
              <p className="text-xs text-text-muted">{successToast}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
