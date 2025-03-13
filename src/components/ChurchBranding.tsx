import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Building2 } from 'lucide-react';

function ChurchBranding() {
  const { data: tenant } = useQuery({
    queryKey: ['tenant-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_current_tenant');

      if (error) throw error;
      return data?.[0];
    },
  });

  // Create refs for checking text truncation
  const nameRef = React.useRef<HTMLHeadingElement>(null);
  const [isNameTruncated, setIsNameTruncated] = React.useState(false);

  // Check for truncation on mount and window resize
  React.useEffect(() => {
    const checkTruncation = () => {
      if (nameRef.current) {
        setIsNameTruncated(
          nameRef.current.scrollWidth > nameRef.current.clientWidth
        );
      }
    };

    checkTruncation();
    window.addEventListener('resize', checkTruncation);

    return () => {
      window.removeEventListener('resize', checkTruncation);
    };
  }, [tenant?.name]);

  return (
    <div className="flex items-center w-full">
      {tenant?.profile_picture_url ? (
        <img
          src={tenant.profile_picture_url}
          alt={tenant.name}
          className="h-8 w-8 rounded object-cover bg-white"
        />
      ) : (
        <div className="h-8 w-8 rounded bg-primary-100 flex items-center justify-center">
          <Building2 className="h-5 w-5 text-primary-600" />
        </div>
      )}
      <div className="ml-2 min-w-0">
        <h1 
          ref={nameRef}
          className="text-lg font-semibold text-gray-900 truncate group relative"
          title={isNameTruncated ? tenant?.name : undefined}
        >
          {tenant?.name || 'Church Admin'}
          {isNameTruncated && (
            <div className="absolute left-0 -bottom-1 translate-y-full invisible group-hover:visible bg-gray-900 text-white text-sm py-1 px-2 rounded shadow-lg whitespace-nowrap z-50">
              {tenant?.name}
            </div>
          )}
        </h1>
      </div>
    </div>
  );
}

export default ChurchBranding;