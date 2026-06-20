import {
  useNavigate as useTanstackNavigate,
  useParams as useTanstackParams,
  useSearch,
  useMatches,
  useRouter,
} from '@tanstack/react-router';

export function useNavigate() {
  const navigate = useTanstackNavigate();
  return (to: string, options?: { replace?: boolean }) => {
    navigate({ to, replace: options?.replace });
  };
}

export function useParams(): Record<string, string> {
  return useTanstackParams({ strict: false }) as Record<string, string>;
}

export function useRoute(): { pageKey: string | undefined; path: string } {
  const router = useRouter();
  const matches = useMatches();
  const currentMatch = matches[matches.length - 1];
  const path = router.state.location.pathname;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pageKey = (currentMatch?.staticData as any)?.pageKey as string | undefined;
  return { pageKey, path };
}

export function useSearchParams(): [URLSearchParams, (params: Record<string, string>) => void] {
  const search = useSearch({ strict: false }) as Record<string, string>;
  const navigate = useTanstackNavigate();

  const searchParams = new URLSearchParams(search);

  const setSearchParams = (params: Record<string, string>) => {
    const merged = { ...search, ...params };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    navigate({ search: merged as any });
  };

  return [searchParams, setSearchParams];
}
