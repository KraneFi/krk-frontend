import { Home } from 'lucide-react';
import { useApp } from '../router.jsx';

export default function NotFound({ page }) {
  const { navigate } = useApp();
  return (
    <div className="grid min-h-full place-items-center bg-slate-50 px-4">
      <div className="text-center">
        <div className="text-[88px] font-light leading-none text-slate-300">404</div>
        <div className="mx-auto my-4 h-px w-16 bg-slate-200" />
        <h1 className="text-[22px] font-medium text-slate-800">Page Not Found</h1>
        <p className="mt-2 text-[15px] text-slate-500">The page <strong className="text-slate-700">"{page}"</strong> could not be found in this application.</p>
        <button onClick={() => navigate('/')} className="mt-8 inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-[14px] font-medium text-slate-700 hover:bg-slate-50"><Home className="h-4 w-4" />Go Home</button>
      </div>
    </div>
  );
}
