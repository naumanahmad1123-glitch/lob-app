import { useState, useEffect, useRef } from 'react';
import { MapPin, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Prediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface PlaceResult {
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
}

interface PlacesAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (result: PlaceResult) => void;
  placeholder?: string;
  className?: string;
  showIcon?: boolean;
}

export function PlacesAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Add a location',
  className = '',
  showIcon = true,
}: PlacesAutocompleteProps) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      setPredictions([]);
      setShowDropdown(false);
    };
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim() || value.length < 2) {
      setPredictions([]);
      setShowDropdown(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch('https://defdvapggdlasisqcqil.supabase.co/functions/v1/places-proxy', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlZmR2YXBnZ2RsYXNpc3FjcWlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0NzI0MDgsImV4cCI6MjA4ODA0ODQwOH0.0arVYpq6YRlg8cjlt3X4aauUX-fY50mQbPVuy17sfLc',
          },
          body: JSON.stringify({ type: 'autocomplete', input: value }),
        });
        const data = await res.json();
        if (data?.predictions) {
          setPredictions(data.predictions);
          setShowDropdown(true);
        }
      } catch (err) {
        console.error('Places autocomplete error:', err);
        setPredictions([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = async (prediction: Prediction) => {
    onChange(prediction.structured_formatting.main_text);
    setShowDropdown(false);
    setPredictions([]);
    try {
      const res = await fetch('https://defdvapggdlasisqcqil.supabase.co/functions/v1/places-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlZmR2YXBnZ2RsYXNpc3FjcWlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0NzI0MDgsImV4cCI6MjA4ODA0ODQwOH0.0arVYpq6YRlg8cjlt3X4aauUX-fY50mQbPVuy17sfLc',
        },
        body: JSON.stringify({ type: 'details', place_id: prediction.place_id }),
      });
      const data = await res.json();
      if (data?.result) {
        const result = data.result;
        onSelect({
          name: result.name || prediction.structured_formatting.main_text,
          address: result.formatted_address || prediction.description,
          lat: result.geometry?.location?.lat || null,
          lng: result.geometry?.location?.lng || null,
        });
      } else {
        onSelect({
          name: prediction.structured_formatting.main_text,
          address: prediction.description,
          lat: null,
          lng: null,
        });
      }
    } catch {
      onSelect({
        name: prediction.structured_formatting.main_text,
        address: prediction.description,
        lat: null,
        lng: null,
      });
    }
  };

  const handleClear = () => {
    onChange('');
    setPredictions([]);
    setShowDropdown(false);
    onSelect({ name: '', address: '', lat: null, lng: null });
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        {showIcon && (
          <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground pointer-events-none" />
        )}
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          className={`w-full p-3 ${showIcon ? 'pl-9' : ''} ${value ? 'pr-9' : ''} rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary ${className}`}
        />
        {value && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-3.5 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      {showDropdown && predictions.length > 0 && (
        <div className="absolute z-[9999] w-full mt-1 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
          {predictions.map(p => (
            <button
              key={p.place_id}
              onClick={() => handleSelect(p)}
              className="w-full px-4 py-3 text-left hover:bg-secondary active:bg-secondary transition-colors border-b border-border/50 last:border-0"
            >
              <p className="text-sm font-medium text-foreground">{p.structured_formatting.main_text}</p>
              <p className="text-xs text-muted-foreground truncate">{p.structured_formatting.secondary_text}</p>
            </button>
          ))}
          {loading && (
            <div className="px-4 py-3 text-xs text-muted-foreground">Searching...</div>
          )}
        </div>
      )}
    </div>
  );
}
