import { useEffect } from 'react';

import MyProjects from '../MyProjects';
import { ROUTE_TITLES, setDocumentTitle } from '../../lib/pageTitles';

export default function GuardadosPage() {
    useEffect(() => {
        setDocumentTitle(ROUTE_TITLES.guardados);
    }, []);

    return (
        <div>
            <h1 className="page-title">Guardados</h1>
            <p className="page-subtitle">Proyectos legislativos que estás siguiendo</p>
            <MyProjects embedded />
        </div>
    );
}
