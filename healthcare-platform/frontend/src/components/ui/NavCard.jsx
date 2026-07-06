import { Link } from 'react-router-dom';

export default function NavCard({ to, icon, title, description }) {
  return (
    <Link
      to={to}
      className="bubble-card block p-4 no-underline hover:border-sky-200"
    >
      <span className="text-xl block mb-2">{icon}</span>
      <h3 className="font-semibold text-slate-900">{title}</h3>
      {description && <p className="text-sm mt-1 text-slate-500 line-clamp-2">{description}</p>}
    </Link>
  );
}
