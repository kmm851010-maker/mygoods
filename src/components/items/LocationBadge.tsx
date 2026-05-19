import { MapPin } from 'lucide-react';

export default function LocationBadge() {
  return (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
      <MapPin size={9} />
      위치인증
    </span>
  );
}
