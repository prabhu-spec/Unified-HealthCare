/**
 * Status badge for tables/cards. Use for Paid, Pending, Active, Expired, In-stock, Out-of-stock, etc.
 */
const VARIANT_CLASSES = {
  success: 'bg-green-100 text-green-800 border-green-200',
  warning: 'bg-amber-100 text-amber-800 border-amber-200',
  error: 'bg-red-100 text-red-800 border-red-200',
  info: 'bg-blue-100 text-blue-800 border-blue-200',
  neutral: 'bg-gray-100 text-gray-800 border-gray-200'
};

const LABEL_TO_VARIANT = {
  paid: 'success',
  active: 'success',
  accepted: 'success',
  approved: 'success',
  'in-stock': 'success',
  completed: 'success',
  admitted: 'success',
  available: 'success',
  verified: 'success',
  full: 'neutral',
  pending: 'warning',
  'low stock': 'warning',
  expired: 'error',
  rejected: 'error',
  'out-of-stock': 'error',
  cancelled: 'neutral'
};

export default function StatusBadge({ status, variant }) {
  const v = variant || LABEL_TO_VARIANT[String(status).toLowerCase().replace(/\s/g, '-')] || 'neutral';
  const className = `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${VARIANT_CLASSES[v]}`;
  return <span className={className}>{status}</span>;
}
