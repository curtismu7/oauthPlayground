import { useEffect, useState } from 'react';
import styled from 'styled-components';
import pkg from '../../package.json';

const FooterBar = styled.footer`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 32px;
  background: ${({ theme }) => theme.colors.gray100};
  color: ${({ theme }) => theme.colors.gray700};
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1rem;
  border-top: 1px solid ${({ theme }) => theme.colors.gray200};
  z-index: 800;
  font-size: 0.85rem;
`;

const StatusDot = styled.span<{ $ok: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 9999px;
  display: inline-block;
  margin-right: 0.5rem;
  background: ${({ $ok }) => ($ok ? '#16a34a' : '#9ca3af')};
`;

export default function Footer() {
  const [status, setStatus] = useState<'ok' | 'unknown'>('unknown');

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function check() {
      try {
        // Optional health endpoint; non-fatal if missing
        const res = await fetch('/api/health', { signal: controller.signal });
        if (!cancelled && res.ok) setStatus('ok');
      } catch {
        // leave as unknown
      }
    }
    check();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  const version = (pkg as any)?.version ?? '0.0.0';

  return (
    <FooterBar>
      <div>
        <strong>OAuth/OIDC Playground</strong> v{version}
      </div>
      <div title={status === 'ok' ? 'Server healthy' : 'Health unknown'}>
        <StatusDot $ok={status === 'ok'} />
        {status === 'ok' ? 'Server: OK' : 'Server: N/A'}
      </div>
    </FooterBar>
  );
}
