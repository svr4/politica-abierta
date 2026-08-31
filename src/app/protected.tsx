import type { ReactElement } from 'react';

interface ProtectedProps {
    children: ReactElement;
}

export default function Protected({ children }: ProtectedProps) {
    return children;
}
